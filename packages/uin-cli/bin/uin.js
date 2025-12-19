#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { readFile, writeFile } from 'fs/promises';
import { UINParser, validateUIN } from '@uin/core';
import { toSVG, toDepthMap, toPrompt, toStructuredPrompt, toComfyUIWorkflow } from '@uin/adapters';

const program = new Command();

program
  .name('uin')
  .description('Universal Image Notation CLI - Convert UIN scenes to various formats')
  .version('0.1.0');

/**
 * RENDER command - Convert UIN to SVG
 */
program
  .command('render <input>')
  .description('Render UIN scene to SVG')
  .option('-o, --output <file>', 'Output file path', 'output.svg')
  .option('--no-validate', 'Skip validation')
  .action(async (input, options) => {
    try {
      console.log(chalk.blue('📄 Reading UIN file...'));
      const data = await readFile(input, 'utf8');
      
      console.log(chalk.blue('🎨 Rendering SVG...'));
      const svg = toSVG(data, { validate: options.validate });
      
      await writeFile(options.output, svg, 'utf8');
      console.log(chalk.green(`✅ SVG saved to ${options.output}`));
      
      // Stats
      const parser = new UINParser(data);
      console.log(chalk.gray(`   Objects: ${parser.objects.length}`));
      console.log(chalk.gray(`   Viewport: ${parser.viewport.width}x${parser.viewport.height}`));
    } catch (error) {
      console.error(chalk.red(`❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

/**
 * DEPTH command - Generate depth map
 */
program
  .command('depth <input>')
  .description('Generate depth map PNG for ControlNet')
  .option('-o, --output <file>', 'Output file path', 'depth_map.png')
  .option('--no-validate', 'Skip validation')
  .action(async (input, options) => {
    try {
      console.log(chalk.blue('📄 Reading UIN file...'));
      const data = await readFile(input, 'utf8');
      
      console.log(chalk.blue('🗺️  Generating depth map...'));
      const depthData = await toDepthMap(data, { validate: options.validate });
      
      await writeFile(options.output, depthData);
      console.log(chalk.green(`✅ Depth map saved to ${options.output}`));
      
      const parser = new UINParser(data);
      const bounds = parser.canvas.bounds;
      console.log(chalk.gray(`   Z-range: [${bounds.z[0]}, ${bounds.z[1]}]`));
      console.log(chalk.gray(`   Objects: ${parser.objects.length}`));
    } catch (error) {
      console.error(chalk.red(`❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

/**
 * PROMPT command - Generate text-to-image prompt
 */
program
  .command('prompt <input>')
  .description('Generate optimized text-to-image prompt')
  .option('-s, --style <style>', 'Add style modifier')
  .option('--no-quality', 'Exclude quality tags')
  .option('--structured', 'Output structured prompt with metadata')
  .option('--no-validate', 'Skip validation')
  .action(async (input, options) => {
    try {
      console.log(chalk.blue('📄 Reading UIN file...'));
      const data = await readFile(input, 'utf8');
      
      if (options.structured) {
        const result = toStructuredPrompt(data, {
          style: options.style,
          qualityTags: options.quality,
          validate: options.validate
        });
        
        console.log(chalk.green('\n✅ Structured Prompt:\n'));
        console.log(chalk.bold('Positive:'));
        console.log(chalk.white(result.positive));
        console.log(chalk.bold('\nNegative:'));
        console.log(chalk.gray(result.negative));
        console.log(chalk.bold('\nMetadata:'));
        console.log(JSON.stringify(result.metadata, null, 2));
      } else {
        const prompt = toPrompt(data, {
          style: options.style,
          qualityTags: options.quality,
          validate: options.validate
        });
        
        console.log(chalk.green('\n✅ Prompt:\n'));
        console.log(chalk.white(prompt));
      }
    } catch (error) {
      console.error(chalk.red(`❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

/**
 * VALIDATE command - Validate UIN structure
 */
program
  .command('validate <input>')
  .description('Validate UIN file structure')
  .action(async (input) => {
    try {
      console.log(chalk.blue('📄 Reading UIN file...'));
      const data = await readFile(input, 'utf8');
      const uin = JSON.parse(data);
      
      console.log(chalk.blue('🔍 Validating...'));
      validateUIN(uin);
      
      console.log(chalk.green('✅ Validation passed!'));
      
      // Show summary
      const parser = new UINParser(uin);
      console.log(chalk.bold('\nSummary:'));
      console.log(chalk.gray(`  Version: ${parser.version}`));
      console.log(chalk.gray(`  Objects: ${parser.objects.length}`));
      console.log(chalk.gray(`  Canvas bounds: x[${parser.canvas.bounds.x}] y[${parser.canvas.bounds.y}] z[${parser.canvas.bounds.z}]`));
      
      // Object types
      const types = {};
      parser.objects.forEach(obj => {
        types[obj.type] = (types[obj.type] || 0) + 1;
      });
      console.log(chalk.gray('  Object types:'));
      Object.entries(types).forEach(([type, count]) => {
        console.log(chalk.gray(`    - ${type}: ${count}`));
      });
    } catch (error) {
      console.error(chalk.red(`❌ Validation failed: ${error.message}`));
      process.exit(1);
    }
  });

/**
 * COMFYUI command - Generate ComfyUI workflow
 */
program
  .command('comfyui <input>')
  .description('Generate ComfyUI workflow with depth map')
  .option('-o, --output <file>', 'Output workflow JSON', 'workflow.json')
  .option('-d, --depth <file>', 'Output depth map PNG', 'uin_depth_map.png')
  .option('--no-prompt', 'Exclude auto-generated prompt')
  .option('--no-validate', 'Skip validation')
  .action(async (input, options) => {
    try {
      console.log(chalk.blue('📄 Reading UIN file...'));
      const data = await readFile(input, 'utf8');
      
      console.log(chalk.blue('⚙️  Generating ComfyUI workflow...'));
      const result = await toComfyUIWorkflow(data, {
        includePrompt: options.prompt,
        validate: options.validate
      });
      
      // Save workflow
      await writeFile(options.output, JSON.stringify(result.workflow, null, 2), 'utf8');
      console.log(chalk.green(`✅ Workflow saved to ${options.output}`));
      
      // Save depth map
      await writeFile(options.depth, result.depthMap);
      console.log(chalk.green(`✅ Depth map saved to ${options.depth}`));
      
      console.log(chalk.bold('\nNext steps:'));
      console.log(chalk.gray('  1. Open ComfyUI'));
      console.log(chalk.gray(`  2. Load workflow: ${options.output}`));
      console.log(chalk.gray(`  3. Depth map is ready at: ${options.depth}`));
      console.log(chalk.gray('  4. Queue prompt!'));
    } catch (error) {
      console.error(chalk.red(`❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

/**
 * INFO command - Show UIN file information
 */
program
  .command('info <input>')
  .description('Display detailed information about UIN file')
  .action(async (input) => {
    try {
      const data = await readFile(input, 'utf8');
      const parser = new UINParser(data);
      
      console.log(chalk.bold.blue('\n📊 UIN File Information\n'));
      
      console.log(chalk.bold('General:'));
      console.log(`  Version: ${chalk.green(parser.version)}`);
      console.log(`  Aspect Ratio: ${chalk.green(parser.canvas.aspect_ratio)}`);
      console.log(`  Viewport: ${chalk.green(`${parser.viewport.width}x${parser.viewport.height}`)}`);
      
      console.log(chalk.bold('\nBounds:'));
      console.log(`  X: ${chalk.cyan(`[${parser.canvas.bounds.x[0]}, ${parser.canvas.bounds.x[1]}]`)}`);
      console.log(`  Y: ${chalk.cyan(`[${parser.canvas.bounds.y[0]}, ${parser.canvas.bounds.y[1]}]`)}`);
      console.log(`  Z: ${chalk.cyan(`[${parser.canvas.bounds.z[0]}, ${parser.canvas.bounds.z[1]}]`)}`);
      
      console.log(chalk.bold('\nObjects:'));
      parser.objects.forEach((obj, i) => {
        console.log(`  ${i + 1}. ${chalk.yellow(obj.type)} at (${obj.position.x}, ${obj.position.y}, ${obj.position.z})`);
        if (obj.measurements) {
          Object.entries(obj.measurements).forEach(([key, val]) => {
            console.log(chalk.gray(`     - ${key}: ${val.value} ${val.unit || ''}`));
          });
        }
      });
      
      if (parser.raw.global?.lighting) {
        console.log(chalk.bold('\nLighting:'));
        console.log(`  Type: ${chalk.magenta(parser.raw.global.lighting.type)}`);
      }
    } catch (error) {
      console.error(chalk.red(`❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

program.parse();
