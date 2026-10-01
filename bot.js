const telefone = "5511953622481";
const apikey = "7271489"; // Coloque aqui a sua apiKey numérica real

const mensagem = `Novo episódio disponível: ${nomeDoAnime}`;
const url = `https://api.callmebot.com/whatsapp.php?phone=${telefone}&text=${encodeURIComponent(mensagem)}&apikey=${apikey}`;

// Exemplo de requisição com fetch ou axios
await fetch(url);
