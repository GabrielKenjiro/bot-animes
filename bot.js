const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://meusanimes.blog/';
const PHONE = '5511953622481';
const APIKEY = '7271489';

// Arquivo onde salvaremos o último episódio no GitHub
const dbPath = path.join(__dirname, 'ultimo_episodio.txt');

async function verificarNovoEpisodio() {
    try {
        let ultimoEpisodioVisto = '';
        if (fs.existsSync(dbPath)) {
            ultimoEpisodioVisto = fs.readFileSync(dbPath, 'utf8').trim();
        }

        console.log(`Verificando o site ${SITE_URL}...`);
        const { data } = await axios.get(SITE_URL, {
            httpsAgent: new (require('https')).Agent({ rejectUnauthorized: false })
        });
        const $ = cheerio.load(data);

        const novoEpisodioElemento = $('article.item.se.episodes').first();
        const nomeDoEpisodio = novoEpisodioElemento.find('.data a').text().trim() || 'Novo Episódio Desconhecido';
        const linkDoEpisodio = novoEpisodioElemento.find('.data a').attr('href') || SITE_URL;

        console.log(`Último episódio no site: ${nomeDoEpisodio}`);
        console.log(`Último episódio salvo: ${ultimoEpisodioVisto}`);

        if (nomeDoEpisodio && nomeDoEpisodio !== ultimoEpisodioVisto) {
            console.log(`Novo episódio encontrado! Enviando mensagem...`);
            
            // Texto da mensagem
            const mensagem = encodeURIComponent(`*🤖 Bip Bop! Anime Novo!*\n\nLançou: *${nomeDoEpisodio}*\nAssista aqui: ${linkDoEpisodio}`);
            const callmebotUrl = `https://api.callmebot.com/whatsapp.php?phone=${PHONE}&text=${mensagem}&apikey=${APIKEY}`;
            
            await axios.get(callmebotUrl);
            console.log('Mensagem enviada no WhatsApp!');

            // Salva o novo episódio no arquivo
            fs.writeFileSync(dbPath, nomeDoEpisodio);
            console.log('Arquivo ultimo_episodio.txt atualizado com sucesso.');
        } else {
            console.log('Nenhum episódio novo por enquanto.');
        }

    } catch (error) {
        console.error('Erro ao verificar o site de animes:', error.message);
    }
}

verificarNovoEpisodio();
