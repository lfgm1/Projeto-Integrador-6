# Projeto Integrador 6

API de cadastro de produtos desenvolvida em Node.js e TypeScript. O projeto mantém a organização em rotas, controllers, services e models, com persistência em SQLite usando Sequelize.

## Como executar

É necessário ter o Node.js 22 ou superior instalado.

```sh
npm ci
npm run dev
```

A API fica disponível em `http://localhost:3000/produtos`. O arquivo `produtos.sqlite` e a tabela `produtos` são criados automaticamente na primeira execução. Os registros continuam salvos ao reiniciar o servidor.

Para executar a versão compilada:

```sh
npm run build
npm start
```

As variáveis de ambiente `PORT` e `DB_STORAGE` permitem alterar a porta e o caminho do banco. Por padrão, são usados a porta 3000 e o arquivo `produtos.sqlite` na raiz do projeto. O servidor atende localmente, em `127.0.0.1`.

## Organização

- `src/interfaces`: contratos dos dados de produto e das operações do serviço.
- `src/models`: definição da tabela no Sequelize e regra de promoção.
- `src/services`: validação e operações de cadastro, consulta, atualização e exclusão.
- `src/controllers`: recebe as requisições e devolve as respostas HTTP.
- `src/routes`: associa os endereços aos métodos do controller.
- `src/config`: conexão com o banco relacional SQLite.
- `tests`: testes da API, do servidor e da persistência.

A interface `IProdutoService` declara os métodos do CRUD sem implementar seu comportamento. A classe `ProdutoService` usa `implements IProdutoService` e fornece essas implementações. O controller depende desse contrato. As interfaces `DadosProduto` e `ProdutoAtributos` definem os campos do produto.

## Rotas

| Método | Endereço | Operação | Sucesso |
| --- | --- | --- | --- |
| GET | `/produtos` | Listar produtos | 200 |
| GET | `/produtos/:id` | Buscar pelo código | 200 |
| POST | `/produtos` | Cadastrar | 201 |
| PUT | `/produtos/:id` | Atualizar nome e preço | 200 |
| DELETE | `/produtos/:id` | Excluir | 204 |

No cadastro e na atualização, enviar `Content-Type: application/json` com o corpo:

```json
{
  "nome": "Teclado",
  "preco": 89.90
}
```

O nome deve ter entre 1 e 120 caracteres. O preço deve ser numérico, não negativo, ter até duas casas decimais e não ultrapassar 99.999.999,99. O código é gerado pelo banco. A atualização exige nome e preço, assim como o cadastro.

Dados inválidos retornam 400; um código válido que não existe retorna 404. O limite do corpo é de 16 KB, com retorno 413 quando excedido. Falhas inesperadas retornam 500 sem expor detalhes internos do banco. Os erros seguem o formato:

```json
{
  "mensagem": "Produto não encontrado."
}
```

O método `estaEmPromocao()` foi mantido no model: produtos com preço abaixo de R$ 100 atendem à regra. Ele não adiciona campos à resposta da API.

## Testes e cobertura

```sh
npm test
```

Os testes usam Jest e Supertest. O CRUD é executado contra um SQLite em memória, separado do banco da aplicação. Há também um teste com arquivo temporário que fecha a conexão e reabre o banco para verificar a persistência.

A suíte cobre o fluxo completo do CRUD, validações, códigos inválidos, registros inexistentes, atualização sem perda de dados em caso de erro e respostas de falha. A coleta inclui todos os arquivos TypeScript de `src`, inclusive a inicialização do servidor. Interfaces não geram código executável.

O Jest exige pelo menos **91%** em linhas, instruções, funções e ramificações. O relatório aparece no terminal e em `coverage/index.html`. Para verificar apenas a tipagem, execute `npm run typecheck`.

As definições do model seguem a [documentação de TypeScript do Sequelize](https://sequelize.org/docs/v6/other-topics/typescript/). O limite de cobertura é configurado com [`coverageThreshold` do Jest](https://jestjs.io/docs/configuration#coveragethreshold-object).
