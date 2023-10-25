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
                    ref: context.payload.pull_request.head.sha
                }
            );

            const zipData: any = zip.data

            const fs = require('fs');


            const truncatedSha = context.payload.pull_request.head.sha.substring(0, 7)

            const repoDir = `/tmp/tilsley-mettle-demo-${context.payload.repository.name}-${truncatedSha}`
            console.log(repoDir)

            fs.writeFileSync('./tmp.zip', Buffer.from(zipData));
            const extract = require('extract-zip')
            await extract('./tmp.zip', {dir: '/tmp'})

            console.log('successfully extracted zip')


            console.log(systemSync("pwd").toString())
            console.log(systemSync(`cd ${repoDir} && snyk test`).toString())


        }
    )
    ;
// For more information on building apps:
// https://probot.github.io/docs/

// To get your app running against GitHub, see:
// https://probot.github.io/docs/development/
}
;

function systemSync(cmd: any) {
    const {execSync} = require('child_process')
    try {
        return execSync(cmd).toString();
    } catch (error: any) {
        console.log(error.status);  // Might be 127 in your example.
        console.log(error.stderr);  // Holds the stderr output. Use `.toString()`.
        console.log(error.stdout.toString());  // Holds the stdout output. Use `.toString()`.
        return error.message; // Holds the message you typically want.
    }
};
