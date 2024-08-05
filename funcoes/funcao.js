const fs = require('fs');
const caminhoArquivoConfig = './config.json';

async function atualizarIdGrupo(idgrupo) {
    try {
        // Passo 1: Ler o JSON do arquivo
        const dados = await fs.promises.readFile(caminhoArquivoConfig, 'utf8');
        const json = JSON.parse(dados);

        // Passo 2: Atualizar o JSON
        const novoIdGrupo = idgrupo; // Novo valor para idgrupo
        const objetoIdGrupo = json.find(obj => obj.hasOwnProperty("idgrupo"));

        if (objetoIdGrupo) {
            objetoIdGrupo.idgrupo = novoIdGrupo;
        } else {
            console.log("Campo 'idgrupo' não encontrado no JSON.");
            return 'Campo \'idgrupo\' não encontrado no JSON.';
        }

        // Passo 3: Salvar o JSON atualizado no arquivo
        await fs.promises.writeFile(caminhoArquivoConfig, JSON.stringify(json, null, 2), 'utf8');
        console.log('Arquivo salvo com sucesso!');
        return 'ID do grupo atualizado com sucesso!';

    } catch (err) {
        console.error('Erro ao ler ou salvar o arquivo:', err);
        return `Erro ao atualizar o ID do grupo: ${err.message}`;
    }
}

module.exports = { atualizarIdGrupo };