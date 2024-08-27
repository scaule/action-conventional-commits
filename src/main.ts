import { context } from "@actions/github";
import * as core from "@actions/core";
import isValidCommitMessage from "./isValidCommitMesage";
import extractCommits from "./extractCommits";

async function run() {
    core.info(
        `ℹ️ Checking if commit messages are following the Conventional Commits specification...`
    );

    // Get the current and target branch names
    const headRef = context.ref.replace('refs/heads/', '');
    const baseRef = context.payload.pull_request?.base?.ref;

    //core.info(`Release process docs: here wiki`);
    core.info(`current: ${headRef}`);
    core.info(`target: ${baseRef}`);
    if (baseRef) {
        if (headRef.startsWith('hotfix') || headRef.startsWith('release')) {
            if (baseRef !== 'master' || baseRef !== 'main') {
                core.setFailed("🚫 Hotfix or release branches must target the 'master' branch.");
                return;
            }
        } else {
            if (baseRef === 'master' || baseRef === 'main') {
                core.setFailed("🚫 Non-hotfix/release branches cannot target the 'master' branch.");
                return;
            }
        }
    } else {
        core.setFailed("🚫 Could not determine the target branch.");
        return;
    }

    // Continue with the commit message validation
    const extractedCommits = await extractCommits(context, core);
    if (extractedCommits.length === 0) {
        core.info(`No commits to check, skipping...`);
        return;
    }

    let hasErrors = false;
    core.startGroup("Commit messages:");
    const allowedCommitTypes = core.getInput("allowed-commit-types").split(",");

    for (let i = 0; i < extractedCommits.length; i++) {
        let commit = extractedCommits[i];

        if (isValidCommitMessage(commit.message, allowedCommitTypes)) {
            core.info(`✅ ${commit.message}`);
        } else {
            core.info(`🚩 ${commit.message}`);
            hasErrors = true;
        }
    }
    core.endGroup();

    if (hasErrors) {
        core.setFailed(
            `🚫 According to the conventional-commits specification, some of the commit messages are not valid.`
        );
    } else {
        core.info("🎉 All commit messages are following the Conventional Commits specification.");
    }
}

run();
