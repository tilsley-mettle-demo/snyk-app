import {Probot} from "probot";
import fs from "fs";
import extract from "extract-zip";

export default (app: Probot) => {
    app.on(["pull_request.opened", "pull_request.reopened"], async (context) => {


            const zip = await context.octokit.rest.repos.downloadZipballArchive({
                    owner: 'tilsley-mettle-demo',
                    repo: context.payload.repository.name,
                    ref: context.payload.pull_request.head.sha
                }
            );

            const filename = zip.headers['content-disposition']?.toString().split('filename=')[1].replace('.zip', '')

            fs.writeFileSync('./tmp.zip', Buffer.from(zip.data as any));
            await extract('./tmp.zip', {dir: `/tmp/${filename}`})

            app.log.info("Checking to see if project contains gradle")
            const gradleTestOutput = systemSync(`cd /tmp/${filename} && cd $(ls -d */|head -n 1) && ls && ./gradlew --version`)

            if (gradleTestOutput.status != 0) {
                app.log.info("Current project is not a gradle project, exiting without running snyk test")
                return;
            }

            const createCheckResponse = await context.octokit.rest.checks.create({
                owner: 'tilsley-mettle-demo',
                repo: context.payload.repository.name,
                name: 'snyk test',
                head_sha: `${context.payload.pull_request.head.sha}`,
                output: {
                    title: 'snyk test',
                    summary: 'running snyk test',
                }
            })

            app.log.info("Running snyk test")
            const snykTestOutput = systemSync(`cd /tmp/${filename} && cd $(ls -d */|head -n 1) && snyk test`)
            const conclusion = snykTestOutput.status == 0 ? 'success' : 'failure'

            await context.octokit.rest.checks.update({
                owner: 'tilsley-mettle-demo',
                repo: context.payload.repository.name,
                check_run_id: createCheckResponse.data.id,
                conclusion: conclusion,
                head_sha: `${context.payload.pull_request.head.sha}`,
                output: {
                    title: 'snyk test',
                    summary: 'snyk has ran',
                    text: snykTestOutput.stdout
                }
            })

            app.log.info(`Completed snyk test with status ${snykTestOutput.status} removing folder /tmp/${filename}`)

            // fs.rmSync(`/tmp/${filename}`, {recursive: true, force: true});
        }
    );
// For more information on building apps:
// https://probot.github.io/docs/

// To get your app running against GitHub, see:
// https://probot.github.io/docs/development/
}
;

function systemSync(cmd: any) {
    const {execSync} = require('child_process')
    try {
        const execString: string = execSync(cmd).toString();
        return {
            status: 0,
            stdout: execString
        }
    } catch (error: any) {
        return {
            status: error.status,
            stdout: error.stdout.toString()
        };
    }
};
