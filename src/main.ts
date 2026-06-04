import * as core from "@actions/core"
import jwt from "jsonwebtoken"

export async function run(): Promise<void> {
    // create jwt to obtain app installation token
    const appId = core.getInput("app-id")
    const repo = core.getInput("repo")
    const jwtSecret = core.getInput("private-key")

    const appJwt = jwt.sign({}, jwtSecret, {
        issuer: appId,
        expiresIn: 300,
        algorithm: "RS256",
    })

    // get installation id for repo

    const repoId = await fetch(
        `https://api.github.com/repos/${repo}/installation`,
        {
            headers: {
                Accept: "application/vnd.github+json",
                Authorization: `Bearer ${appJwt}`,
                "X-Github-Api-Version": "2026-03-10",
            },
        },
    )
        .then((r) => r.json() as { id?: string })
        .then((data) => data.id)
        .catch((err) =>
            core.setFailed(
                `failed to get installation id for repo ${repo}:${err}`,
            ),
        )

    if (!repoId) {
        return
    }

    const token = await fetch(
        `https://api.github.com/app/installations/${repoId}/access_tokens`,
        {
            headers: {
                Accept: "application/vnd.github+json",
                Authorization: `Bearer ${appJwt}`,
                "X-Github-Api-Version": "2026-03-10",
            },
        },
    )
        .then((r) => r.json() as { token?: string })
        .then((data) => data.token)
        .catch((err) => core.setFailed(`failed to get token:${err}`))

    if (!token) {
        return
    }

    core.setOutput("token", token)
}
