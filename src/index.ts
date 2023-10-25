import {Probot} from "probot";

export default (app: Probot) => {
    app.on(["pull_request.opened", "pull_request.reopened"], async (context) => {
            context.octokit.rest.checks.create({
                owner: 'tilsley-mettle-demo',
                repo: 'test-repo',
                name: 'some-check',
                head_sha: `${context.payload.pull_request.head.sha}`,
                output: {
                    title: 'synk',
                    summary: 'snyk has ran',
                    text: 'dump snyk text here'
                }
            })

            const zip = await context.octokit.rest.repos.downloadZipballArchive({
                    owner: 'tilsley-mettle-demo',
                    repo: context.payload.repository.name,
                    ref: context.payload.repository.default_branch
                }
            );

            const zipData: any = zip.data

            const fs = require('fs');

            fs.writeFileSync('./tmp.zip', Buffer.from(zipData));
            const extract = require('extract-zip')
            await extract('./tmp.zip', {dir: '/tmp'})

        }
    )
    ;
// For more information on building apps:
// https://probot.github.io/docs/

// To get your app running against GitHub, see:
// https://probot.github.io/docs/development/
}
;
