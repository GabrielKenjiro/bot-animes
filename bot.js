import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_URL = 'https://meusanimes.blog/';

// ================= CONFIGURAÇÕES DO TELEGRAM =================
const TELEGRAM_BOT_TOKEN = '8941398606:AAG0UTbc2XftanYrU7puov8fNXKZ_0e7PKE'; 
const TELEGRAM_CHAT_ID = '7777383282'; 
// ============================================================

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
            const imagemDoEpisodio = elemento.find('.poster img').attr('src') || '';
            
            if (nomeDoEpisodio) {
                novosParaSalvar.push(nomeDoEpisodio);
                
                if (!ultimosEpisodiosVistos.includes(nomeDoEpisodio) && ultimosEpisodiosVistos.length > 0) {
                    novosEpisodios.push({ 
                        nome: nomeDoEpisodio, 
                        link: linkDoEpisodio,
                        imagem: imagemDoEpisodio
                    });
                }
            }
        }
        
        if (novosEpisodios.length > 0) {
            console.log(`Encontrados ${novosEpisodios.length} novos episódios! Enviando fotos para o Telegram...`);
            
            for (const ep of novosEpisodios) {
                const legenda = `<b>🤖 Bip Bop! Anime Novo!</b>\n\n<b>${ep.nome}</b>\n\n▶️ <a href="${ep.link}">Clique aqui para assistir</a>`;
                
                if (ep.imagem) {
                    // Envia a FOTO NATIVA com a legenda embutida na foto
                    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
                    await axios.post(telegramUrl, {
                        chat_id: TELEGRAM_CHAT_ID,
                        photo: ep.imagem,
                        caption: legenda,
                        parse_mode: 'HTML'
                    });
                } else {
                    // Mensagem de texto caso não tenha foto
                    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
                    await axios.post(telegramUrl, {
                        chat_id: TELEGRAM_CHAT_ID,
                        text: legenda,
                        parse_mode: 'HTML'
                    });
                }
                
                await new Promise(r => setTimeout(r, 1000));
            }
            console.log('Fotos enviadas no Telegram com sucesso!');
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
