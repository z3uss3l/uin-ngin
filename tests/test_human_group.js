const { toSVG } = require('../packages/uin-adapters/source/svg.js');
const { UINParser } = require('../packages/uin-core/src/parser.js');

// Mock DOM parser for node environment (if needed by core, though renderer usually generates strings)
// If dependencies require browser env, this might fail, but let's try the pure logic path.

const testInput = {
    "version": "0.3",
    "metadata": { "description": "Test Group" },
    "canvas": { "aspect_ratio": "16:9", "bounds": { "x": [-10, 10], "y": [-10, 10], "z": [-5, 5] } },
    "objects": [
        {
            "id": "g1",
            "type": "human_group",
            "position": { "x": 0, "y": 0, "z": 0 },
            "features": { "clothing": { "color": "#ff0000" } }
        }
    ]
};

try {
    console.log("Testing human_group rendering...");
    const svg = toSVG(testInput, { validate: false });

    if (svg.includes('<circle') && svg.includes('#ff0000')) {
        console.log("SUCCESS: SVG contains circles and correct color.");
        console.log(svg.substring(0, 150) + "...");
    } else {
        console.error("FAILURE: SVG does not look right.");
        console.error(svg);
        process.exit(1);
    }
} catch (e) {
    console.error("ERROR:", e);
    process.exit(1);
}
