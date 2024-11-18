const {JSDOM, VirtualConsole} = require('jsdom');
const {Readability} = require('@mozilla/readability');
const {NodeHtmlMarkdown} = require('node-html-markdown');
const {writeFile} = require('fs').promises;
const {readFile} = require('fs').promises;

async function main(url, filename) {
    let text;
    // check if the filename is a URL or a filename
    if (filename && filename.startsWith('http')) {
        const resp = await fetch(url);
        text = await resp.text();
    } else {
        text = await readFile(url, 'utf8');
    }

    const virtualConsole = new VirtualConsole();
    const doc = new JSDOM(text, {virtualConsole});

    const reader = new Readability(doc.window.document);
    const article = reader.parse();

    const headerMarkdown = `# [${article.title}](${url})\n\n`;
    const bylineMarkdown = article.byline ? `${article.byline}\n\n` : '';
    const contentMarkdown = NodeHtmlMarkdown.translate(article.content);

    const markdown = headerMarkdown + bylineMarkdown + contentMarkdown;

    const markdownStripped = removeLinksFromMarkdown(markdown);

    if (filename) {
        await writeFile(filename, markdownStripped);
    } else {
        console.log(markdownStripped);
    }
}

function removeLinksFromMarkdown(text) {
    // Replace all link occurrences with the link text
    let regex = /\[([^\]]+)\]\(([^)]+)\)/g;
    text = text.replace(regex, "$1");

    return text;
}

if (process.argv.length < 3) {
    console.error('Usage: mdl <url> [<filename>]');
    return;
}

const url = process.argv[2];
const filename = process.argv[3];
main(url, filename);