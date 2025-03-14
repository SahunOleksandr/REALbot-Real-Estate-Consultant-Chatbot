/**
 * Local configuration setup script
 * This script helps developers set up their local configuration
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const configDir = path.join(__dirname, 'backend', 'config');
const localConfigPath = path.join(configDir, 'local.js');
const templatePath = path.join(configDir, 'local.js.template');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Check if local config exists
if (fs.existsSync(localConfigPath)) {
  console.log('Local config file already exists.');
  rl.question('Do you want to overwrite it? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      promptForConfig();
    } else {
      console.log('Setup canceled. Existing config file was not modified.');
      rl.close();
    }
  });
} else {
  promptForConfig();
}

function promptForConfig() {
  rl.question('Enter your OpenAI API key: ', (apiKey) => {
    if (!apiKey.trim()) {
      console.error('API key cannot be empty. Setup canceled.');
      rl.close();
      return;
    }

    // Read the template file
    fs.readFile(templatePath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading template file:', err);
        rl.close();
        return;
      }

      // Replace the API key in the template
      const configContent = data.replace('your-api-key-here', apiKey.trim());

      // Write to the local config file
      fs.writeFile(localConfigPath, configContent, 'utf8', (err) => {
        if (err) {
          console.error('Error writing config file:', err);
          rl.close();
          return;
        }

        console.log(`\nSuccessfully created local config file with your API key!`);
        console.log(`File location: ${localConfigPath}`);
        console.log(`\nYou can now start the application with: npm start`);
        
        rl.close();
      });
    });
  });
}