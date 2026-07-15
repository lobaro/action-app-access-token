import * as core from "@actions/core"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { run } from "./main"

const { signMock } = vi.hoisted(() => ({
    signMock: vi.fn(),
}))

vi.mock("@actions/core", () => ({
    getInput: vi.fn(),
    setOutput: vi.fn(),
    setFailed: vi.fn(),
}))

vi.mock("jsonwebtoken", () => ({
    default: {
        sign: signMock,
    },
}))

const mockFetch = vi.fn<typeof fetch>()

function jsonResponse(body: unknown): Response {
    return {
        json: vi.fn().mockResolvedValue(body),
    } as unknown as Response
}

describe("run", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.stubGlobal("fetch", mockFetch)

        vi.mocked(core.getInput).mockImplementation((name) => {
            if (name === "app-id") return "42"
            if (name === "repo") return "lobaro/action-app-access-token"
            if (name === "private-key") return "private-key"
            return ""
        })
        signMock.mockReturnValue("app-jwt")
    })

    it("sets output token when both GitHub API calls succeed", async () => {
        mockFetch
            .mockResolvedValueOnce(jsonResponse({ id: "9876" }))
            .mockResolvedValueOnce(
                jsonResponse({ token: "installation-token" }),
            )

        await run()

        expect(signMock).toHaveBeenCalledWith({}, "private-key", {
            issuer: "42",
            expiresIn: 300,
            algorithm: "RS256",
        })
        expect(mockFetch).toHaveBeenNthCalledWith(
            1,
            "https://api.github.com/repos/lobaro/action-app-access-token/installation",
            {
                headers: {
                    Accept: "application/vnd.github+json",
                    Authorization: "Bearer app-jwt",
                    "X-Github-Api-Version": "2026-03-10",
                },
            },
        )
        expect(mockFetch).toHaveBeenNthCalledWith(
            2,
            "https://api.github.com/app/installations/9876/access_tokens",
            {
                headers: {
                    Accept: "application/vnd.github+json",
                    Authorization: "Bearer app-jwt",
                    "X-Github-Api-Version": "2026-03-10",
                },
            },
        )
        expect(core.setOutput).toHaveBeenCalledWith(
            "token",
            "installation-token",
        )
        expect(core.setFailed).not.toHaveBeenCalled()
    })

    it("fails and stops when installation id cannot be retrieved", async () => {
        mockFetch.mockRejectedValueOnce(new Error("network down"))

        await run()

        expect(core.setFailed).toHaveBeenCalledWith(
            "failed to get installation id for repo lobaro/action-app-access-token: Error: network down",
        )
        expect(mockFetch).toHaveBeenCalledTimes(1)
        expect(core.setOutput).not.toHaveBeenCalled()
    })

    it("fails when token response is empty", async () => {
        mockFetch
            .mockResolvedValueOnce(jsonResponse({ id: "9876" }))
            .mockResolvedValueOnce(jsonResponse({}))

        await run()

        expect(core.setFailed).toHaveBeenCalledWith(
            "failed to get token: returned token is empty",
        )
        expect(core.setOutput).not.toHaveBeenCalled()
    })
})
