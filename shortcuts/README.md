# Atalho iOS — "Enviar para PC" (OpenPaste)

Guia completo para criar o Atalho no iPhone que envia conteúdo para o OpenPaste no Windows.

---

## Pré-requisitos

- iPhone e PC na **mesma rede Wi-Fi**
- App **OpenPaste** rodando no Windows (ícone no tray)
- App **Atalhos** (nativo do iOS 13+)

---

## Criando o Atalho manualmente

### 1. Abrir o app Atalhos → "+" → Novo Atalho

### 2. Configurar para receber input do Share Sheet

Toque em **"Atalho recebe"** (no topo) e marque:

| Tipo | Marcar |
|------|--------|
| Texto | ✓ |
| URLs | ✓ |
| Imagens | ✓ |
| Arquivos | ✓ |
| PDFs | ✓ |

> Deixe "Nenhuma entrada" **desmarcado** — também queremos poder disparar manualmente.

---

### 3. Ações do Atalho (na ordem)

#### Ação 1 — Detectar tipo e preparar conteúdo

Adicione **"Se"**:
- **Entrada:** Entrada do Atalho
- **Condição:** não tem valor

**Dentro do "Se"** (sem input — pegar área de transferência):
- Adicione **"Obter área de transferência"**
- Adicione **"Definir variável"** → nome: `payload`

**Dentro do "Senão"** (tem input do Share Sheet):
- Adicione **"Definir variável"** → nome: `payload` → valor: `Entrada do Atalho`

**Fim do Se**

---

#### Ação 2 — Determinar o tipo

Adicione **"Se"** (aninhado ou sequencial):

**Condição:** `payload` é do tipo **Imagem**
- Adicione **"Codificar em Base64"** → entrada: `payload`
- Adicione **"Definir variável"** → `base64Content`
- Adicione **"Definir variável"** → `contentType` = texto `image`
  - Adicione **"Definir variável"** → `fileName` = texto `foto_openpaste.jpg`

**Senão, se:** `payload` é do tipo **Arquivo** ou **PDF**
- Adicione **"Codificar em Base64"** → entrada: `payload`
- Adicione **"Definir variável"** → `base64Content`
- Adicione **"Definir variável"** → `contentType` = texto `file`
- Adicione **"Definir variável"** → `fileName` = `Nome do arquivo` (magic variable do payload)

**Senão** (texto/URL):
- Adicione **"Definir variável"** → `base64Content` = `payload`
- Adicione **"Se"** → `payload` começa com `http`
  - `contentType` = `url`
  - Senão → `contentType` = `text`

---

#### Ação 3 — Enviar para o PC

Adicione **"Obter Conteúdo da URL"**:

| Campo | Valor |
|-------|-------|
| URL | `http://openpaste.local:9876/clip` |
| Método | `POST` |
| Cabeçalhos | `Content-Type: application/json` |
| Corpo | JSON (ver abaixo) |

**Corpo JSON:**
```
{
  "type": [variável contentType],
  "content": [variável base64Content],
  "filename": [variável fileName]
}
```

> No app Atalhos: escolha **"JSON"** como tipo de corpo e adicione cada campo com os Magic Variables correspondentes.

---

#### Ação 4 — Feedback ao usuário

Adicione **"Se"** (verificar resultado):
- Condição: Resultado da URL **contém** `"ok":true`
  - Adicione **"Mostrar Notificação"** → `✓ Enviado para o PC`
- **Senão:**
  - Adicione **"Mostrar Alerta"** → `Falha ao conectar. Verifique o OpenPaste.`

---

### 4. Nomear e configurar

1. Toque no nome do atalho → renomeie para **"Enviar para PC"**
2. Escolha um ícone (sugestão: 📎 ou 💻)
3. Toque em **"Concluído"**

---

## Formas de disparar o Atalho

### Via Share Sheet (recomendado)
Em qualquer app → botão Compartilhar → rolar até **"Enviar para PC"**

> Na primeira vez: toque em **"Mais"** no Share Sheet para adicionar o Atalho à lista.

### Via Widget
1. Tela inicial ou Central de Widgets → pressionar e segurar → **"+"**
2. Adicionar widget **"Atalhos"**
3. Editar widget → selecionar **"Enviar para PC"**

### Via Back Tap (iPhone 8+)
1. **Ajustes** → **Acessibilidade** → **Toque** → **Back Tap**
2. **Toque duplo** (ou triplo) → **"Enviar para PC"**

### Via Botão de Ação (iPhone 15 Pro / 16)
1. **Ajustes** → **Botão de Ação** → selecionar **"Atalho"**
2. Escolher **"Enviar para PC"**

---

## Resolução de problemas

| Problema | Solução |
|----------|---------|
| "Não foi possível conectar" | Verifique se iPhone e PC estão na mesma rede Wi-Fi |
| mDNS não funciona (`openpaste.local`) | Use o IP local exibido nas Configurações do OpenPaste |
| Atalho fica travado em "Executando" | O payload pode ser maior que 50 MB — comprima o arquivo antes |
| Notificação não aparece no PC | Verifique se o Windows não está em Modo Não Perturbe |
| Arquivo salvo com nome errado | Edite o Atalho e verifique a variável `fileName` |

---

## URL de destino alternativa (fallback por IP)

Se `openpaste.local` não funcionar na sua rede, substitua a URL no Atalho por:

```
http://[IP_DO_PC]:9876/clip
```

O IP do PC é exibido nas **Configurações do OpenPaste** (janela do app Windows).

---

## Dica: Atalho "Copiar do PC"

Para fluxo inverso (pegar texto do PC no iPhone), o OpenPaste pode ser estendido futuramente com um endpoint `GET /clip/last` que retorna o último item enviado.
