# action-app-access-token
Generate an access token via an app installation (for accessing private repos during workflow).

This is a GitHub action that can be used in Workflows, to generate an access token for access to 
private repositories on GitHub. It uses an installed GitHub App to generate the token. It basically 
provides the same functionality as [navikt/github-app-token-generator][1], but we cannot 
trust our private keys to a third party action that is not under control. Fell free to fork this repo
for your own organisation, to solve that same problem for you.

This action is a composite action, so it will run light weight inside your own workflow, without 
additional docker containers. This, of course, means, that it will not be strictly separated from
your workflow. It will install a python package inside your workflow. And it will only run inside 
a workflow that is compatible. It was developed using a `ubuntu-latest` runner.

## Usage

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: lobaro/action-app-access-token@v1
        id: installation-token
        with:
          app-id: ${{ secrets.APP_ID }}
          private-key: ${{ secrets.APP_PRIVATE_KEY }}

      - name: Use the token
        env:
          GITHUB_TOKEN: ${{ steps.installation-token.outputs.token }}
        run: |
          # clone a private repo with git:
          git clone https://x-access-token:${GITHUB_TOKEN}@github.com/org/repo
          # or use GitHub CLI (will automatically use the GITHUB_TOKEN env variable):
          gh repo clone org/repo
```

## Requirements
You will need to create a GitHub App and install it on your organisation or individual repositories. 
That App will need to have the following permissions:
* Repository permissions:
  * Contents: Read & write
  * Metadata: Read-only

The App-ID (a number) and the private key (the complete PEM file, including ------BEGIN... and -----END...) 
will need to be stored as secrets in your repository or your organisation. You never commit those values 
to any repository and only expose those secrets to the repositories that need then (the ones with the 
workflow checking out the dependencies - the dependencies do not need it).

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Attribution
Parts of this action are inspired by [navikt/github-app-token-generator][1].

[1]: https://github.com/navikt/github-app-token-generator
