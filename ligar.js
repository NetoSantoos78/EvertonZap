const { exec } = require('child_process');
(async () => {
    const { default: chalk } = await import('chalk');
    
    console.log(chalk.blue.bold.bgRed("[!] Ligando o bot !!!"));
})();



// Definir um atraso de 3 segundos antes de iniciar o PM2
setTimeout(() => {
    exec('pm2 start index.js --name Everton', (error, stdout, stderr) => {
        if (error) {
            console.error(`Erro ao iniciar o bot: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
    });
}, 3000);
