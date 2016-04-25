<!---

Hi there!

Please be sure to run `stf doctor` before submitting an issue. Please include screenshots, command output and log files if any.

=== SUPER COMMON QUESTIONS ===

Q. I'm having issues when multiple devices are connected.
A. Usually caused by insufficient USB power supply or other hardware issue we can't do anything about.

Q. Can I connect a device to STF over WIFI?
A. Yes, with the `--allow-remote` option. However, ADB over WIFI can easily be 10x slower than USB, so don't expect too much.

Q. How do I connect to my local STF from another computer?
A. Try the `--public-ip` option or do a full deployment. See DEPLOYMENT.md in the doc folder.

Q. Can I run STF on multiple machines?
A. Yes, if you do a full deployment. See DEPLOYMENT.md in the doc folder.
-->

## What's the problem (or question)?
<!--- If describing a bug, tell us what happens instead of the expected behavior -->
<!--- If suggesting a change/improvement, explain the difference from current behavior -->

## What should have happened?
<!--- If you're describing a bug, tell us what should happen -->
<!--- If you're suggesting a change/improvement, tell us how it should work -->

## Do you have an idea for a solution?
<!--- Not obligatory, but suggest a fix/reason for the bug, -->
<!--- or ideas how to implement the addition or change -->

## How can we reproduce the issue?
<!--- Provide unambiguous set of steps to reproduce this bug. Include code to reproduce, if relevant -->
1.
2.
3.
4.

## Help us understand your issue by providing context.
<!--- How has this issue affected you? What are you trying to accomplish? -->
<!--- Providing context helps us come up with a solution that is most useful in the real world -->

## Please tell us details about your environment.
<!--- Include as many relevant details about the environment you experienced the bug in -->
* Are you using `stf local` or a [full deployment](doc/DEPLOYMENT.md): 
* Version used (git hash or `stf -V`): 
* Environment name and version (e.g. Chrome 39, node.js 5.4): 
* Operating System and version: 
* If there was a problem with a specific device, run `adb devices -l` and paste the relevant row here: 
