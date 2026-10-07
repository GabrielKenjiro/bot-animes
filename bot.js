import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_URL = 'https://meusanimes.blog/';
const PHONE = '5511953622481';
const APIKEY = '7271489';

const dbPath = path.join(__dirname, 'ultimo_episodio.txt');

async function verificarNovoEpisodio() {
    try {
        let ultimosEpisodiosVistos = [];
        if (fs.existsSync(dbPath)) {
            ultimosEpisodiosVistos = fs.readFileSync(dbPath, 'utf8').trim().split('\n');
        }

        console.log(`Verificando o site ${SITE_URL}...`);
        const { data } = await axios.get(SITE_URL, {
            httpsAgent: new https.Agent({ rejectUnauthorized: false })
        });
        const $ = cheerio.load(data);

        const epNodes = $('article.item.se.episodes');
        
        let novosEpisodios = [];
        let novosParaSalvar = [];
        
        // Checa os primeiros 15 episódios para pular os fixados
        for (let i = 0; i < 15; i++) {
            if (i >= epNodes.length) break;
            
            const elemento = epNodes.eq(i);
            const nomeDoEpisodio = elemento.find('.data a').text().trim();
            const linkDoEpisodio = elemento.find('.data a').attr('href') || SITE_URL;
            
            if (nomeDoEpisodio) {
                novosParaSalvar.push(nomeDoEpisodio);
                
                if (!ultimosEpisodiosVistos.includes(nomeDoEpisodio) && ultimosEpisodiosVistos.length > 0) {
                    novosEpisodios.push({ 
                        nome: nomeDoEpisodio, 
                        link: linkDoEpisodio
                    });
                }
            }
        }
        
        if (novosEpisodios.length > 0) {
            console.log(`Encontrados ${novosEpisodios.length} novos episódios! Enviando para o WhatsApp...`);
            
            for (const ep of novosEpisodios) {
                // Mensagem limpa enviada 1 por 1 para o WhatsApp gerar o cartão com a imagem da capa
                const mensagem = encodeURIComponent(`*🤖 Bip Bop! Anime Novo!*\n\n*${ep.nome}*\n\n▶️ Assista aqui:\n${ep.link}`);
                const callmebotUrl = `https://api.callmebot.com/whatsapp.php?phone=${PHONE}&text=${mensagem}&apikey=${APIKEY}`;
                await axios.get(callmebotUrl);
                
                await new Promise(r => setTimeout(r, 2000));
            }
            console.log('Mensagens enviadas no WhatsApp com sucesso!');
        } else {
            console.log('Nenhum episódio novo por enquanto.');
        }

        fs.writeFileSync(dbPath, novosParaSalvar.join('\n'));
        console.log('Arquivo ultimo_episodio.txt atualizado.');

    } catch (error) {
        console.error('Erro ao verificar o site de animes:', error.message);
    }
}

verificarNovoEpisodio();
