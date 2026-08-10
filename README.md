https://junior2099.github.io/pdf-editor/
# PDF Cut Pro 📄✂️

> **Ferramenta Web Gratuita e 100% Client-Side para Remover e Reordenar Páginas de Arquivos PDF.**

![Favicon](https://img.icons8.com/?size=100&id=mcyAsTDJNTI9&format=png&color=000000)

## 📌 Sobre o Projeto

O **PDF Cut Pro** é uma aplicação web moderna e responsiva desenvolvida em **HTML5, CSS3 e JavaScript Vanilla**, projetada para permitir que qualquer usuário faça upload de um arquivo PDF e remova páginas indesejadas com **apenas 1 clique**.

Todo o processamento é feito **100% localmente no navegador do usuário**, garantindo total privacidade e alta velocidade, sem envio de documentos para servidores externos.

---

## ✨ Principais Funcionalidades

- 🗑️ **Remoção de Páginas com 1 Clique**: Clique no ícone de lixeira no card da página para removê-la instantaneamente.
- 🎨 **Tema Claro por Padrão & Alternador Escuro**: Tema claro moderno pré-definido como padrão, com botão para alternar para o modo escuro a qualquer momento.
- 🔄 **Reordenação Drag & Drop**: Arraste e solte os cards para reorganizar a sequência das páginas do documento.
- 📐 **Remoção por Intervalo / Faixa**: Digite intervalos como `2, 4-7, 10` para excluir múltiplas páginas de uma só vez.
- ↩️ **Sistema de Desfazer (Undo)**: Notificação flutuante para restaurar páginas removidas acidentalmente.
- 🔃 **Rotação de Páginas**: Botão para girar páginas individuais em 90°.
- 🔍 **Pré-visualização em Tela Cheia**: Modal com navegação entre páginas para inspecionar o conteúdo em alta definição.
- ⚡ **Exportação Instantânea**: Baixe o novo PDF editado mantendo a qualidade original.

---

## 🛠️ Tecnologias Utilizadas

- **HTML5 & CSS3**: Design limpo com variáveis CSS, sistema Grid/Flexbox e efeito Glassmorphism.
- **JavaScript (ES6+)**: Manipulação de estado e eventos sem dependências pesadas de frameworks.
- **[PDF.js](https://mozilla.github.io/pdf.js/)**: Renderização assíncrona das miniaturas das páginas em elementos `<canvas>`.
- **[PDF-Lib](https://pdf-lib.js.org/)**: Manipulação e compilação do documento PDF (cópia de páginas, rotação e salvamento).
- **[SortableJS](https://sortablejs.github.io/Sortable/)**: Arrastar e soltar suave para reordenar páginas.
- **[Lucide Icons](https://lucide.dev/)**: Ícones SVG limpos e modernos.

---

## 🚀 Como Executar o Projeto

Como o projeto é construído com tecnologias web padrão, ele pode ser executado diretamente em qualquer navegador moderno.

### Opção 1: Servidor HTTP Local (Recomendado)

Você pode usar o servidor integrado do Python ou qualquer extensão de Live Server:

```bash
# Navegue até a pasta do projeto
cd c:/Users/Loja/Downloads/pdf-remover

# Inicie o servidor HTTP com Python
python -m http.server 3000
```

Abra o navegador e acesse: `http://localhost:3000`

### Opção 2: Abrir diretamente

Basta dar um duplo clique no arquivo [`index.html`](file:///c:/Users/Loja/Downloads/pdf-remover/index.html) para abri-lo no seu navegador.

---

## 🔒 Segurança e Privacidade

- **Zero Server Upload**: O arquivo PDF nunca sai do seu dispositivo.
- **Sem Logs**: Nenhum registro ou histórico é salvo externamente.

---

## 📄 Licença

Este projeto é de código aberto e livre para uso pessoal e comercial.
