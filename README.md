# Better CPF 
## Uma aplicação desenvolvida para automatizar verificações de CPF


BetterCPF é uma aplicação criada para fazer consultas à RECEITA FEDERAL pagando muito menos comparado aos valores hoje fornecidos. Tudo o que você precisa fazer é enviar so dados e esperar que a aplicação te retorne a situação cadastral.

> Obs: O custo para requisições para API da RF é entre R$ 0,50  e R$ 1,00 POR CONSULTA. 
O custo dessa ferramenta é de ~ $0.4 POR 1000 CONSULTAS
- Envie os dados via POST
- Espere a aplicação fazer todo trabalho
- Em poucos segundos você terá a situação cadastral com base em um CPF e DATA DE NASCIMENTO


## Instalação

Better CPF requer  [Node.js](https://nodejs.org/) v12+ para rodar.
Nós usamos o [Anycaptcha](https://anycaptcha.com?referral=6980) para validar captcha, mas qualquer algoritmo de validação de captcha funcionará com poucas adaptações.
> Este projeto é totalmente grátis para uso, então caso opte por usar o Any Captcha, peço que use o meu [LINK](https://anycaptcha.com?referral=6980) para que eu ganhe alguns créditos na plataforma sempre que você colocar créditos.

Instale as dependências e rode o servidor.

```sh
cd better-cpf
npm i
npm run dev
```

## Docker

Com Better CPF é bem simples de installar e dar deploy em um container.
Por padrão o a porta exposta é a 7000, então altere isso caso ache necessário.

Siga as seguintes etapas para criar, rodar e iniciar o container.

```
docker image build -t better-cpf .
docker run -dit -p 7000:7000 --name puppeteer better-cpf
docker exec -it puppeteer npm run dev
``` 
## Uso
Faça uma requisição POST para http://localhost:7000/ passando um JSON com um CPF e uma data de nascimento no formato ddmmYYYY
Ex: 
```
{
    "CPF" : "00000000000",
    "BIRTH_DAY" : "02022022"
}
```



## Bibliotecas
- [Axios](https://www.npmjs.com/package/axios)
- [Dotenv](https://www.npmjs.com/package/dotenv)
- [Express](https://www.npmjs.com/package/express)
- [Puppeteer](https://www.npmjs.com/package/puppeteer)
- [useragent](https://www.npmjs.com/package/user-agents)


## License

MIT

**Free Software, Always!!**
