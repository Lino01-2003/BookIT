# AI Usage

AI assistance was used through GitHub Copilot in VS Code. The tools used included workspace file inspection and search, file patching/creation, and terminal execution for Node tests and syntax checks.

## Prompts used

These are representative prompts from the project work:

1. "Build a small local web application called **BookIt** for booking shared office resources. Use Node.js 20+, plain HTML, CSS, JavaScript, and a small Node.js API."
2. "enaku thani thani page la link pannanum oru dashboard irukanum create booking resoursces irukanum ellam thani thaniya book now button show pannanum"
3. "Update my existing BookIt website color theme to match this dark futuristic neon-pink style. Do not change the website layout, content, pages, functionality, or current font choices."

## Example of corrected AI output

During implementation, an early generated version wrote doubled backslashes into JavaScript regular-expression literals. Valid dates were then rejected as invalid. The regex literals were corrected and the tests were rerun successfully.

Another integration check exposed a generated literal `\\n` in the JSON writer, which made the persisted file invalid after a booking. The writer was corrected to write a real newline, and the create/cancel flow was rerun.

I reviewed and understood the final code and can explain how the booking validation, conflict detection, JSON persistence, HTTP routes, browser pages, and tests work.
