"use strict";

async function upsertDailyPage(report, config, notionRequest) {
  const query = await notionRequest(`/v1/databases/${config.notionDatabaseId}/query`, {
    method: "POST",
    body: {
      filter: {
        property: config.notionTitleProperty,
        title: {
          equals: report.title,
        },
      },
    },
  });

  if (query.results?.length) {
    return query.results[0].id;
  }

  const page = await notionRequest("/v1/pages", {
    method: "POST",
    body: {
      parent: {
        database_id: config.notionDatabaseId,
      },
      properties: {
        [config.notionTitleProperty]: {
          title: [{ text: { content: report.title } }],
        },
      },
    },
  });

  return page.id;
}

async function uploadCodexExportToNotion(result, config, notionRequest, blockHelpers) {
  const page = await notionRequest("/v1/pages", {
    method: "POST",
    body: {
      parent: {
        database_id: config.notionDatabaseId,
      },
      properties: {
        [config.notionTitleProperty]: {
          title: [{ text: { content: result.title } }],
        },
      },
    },
  });

  await replacePageBlocks(page.id, buildCodexExportBlocks(result, blockHelpers), notionRequest);
  return page.id;
}

async function replacePageBlocks(pageId, blocks, notionRequest) {
  const existing = await notionRequest(`/v1/blocks/${pageId}/children?page_size=100`, {
    method: "GET",
  });

  for (const block of existing.results || []) {
    await notionRequest(`/v1/blocks/${block.id}`, {
      method: "PATCH",
      body: {
        archived: true,
      },
    });
  }

  for (let index = 0; index < blocks.length; index += 50) {
    await notionRequest(`/v1/blocks/${pageId}/children`, {
      method: "PATCH",
      body: {
        children: blocks.slice(index, index + 50),
      },
    });
  }
}

function createNotionRequest(config) {
  return async function notionRequest(endpoint, options) {
    const response = await fetch(`https://api.notion.com${endpoint}`, {
      method: options.method,
      headers: {
        Authorization: `Bearer ${config.notionToken}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Notion request failed (${response.status}): ${text}`);
    }

    return response.status === 204 ? {} : response.json();
  };
}

function buildCodexExportBlocks(result, helpers) {
  const { headingBlock, paragraphBlock, chunkText } = helpers;
  const summaryLines = [`Source: ${result.inputPath}`, `Entries: ${result.count}`, `Format: ${result.format}`];

  return [
    headingBlock("Summary"),
    ...chunkText(summaryLines.join("\n"), 1800).map(paragraphBlock),
    headingBlock("Transcript"),
    ...chunkText(result.rendered, 1800).map(paragraphBlock),
  ];
}

function createBlocks(sections, helpers) {
  const { headingBlock, paragraphBlock, chunkText } = helpers;
  const blocks = [];
  for (let i = 0; i < sections.length; i += 2) {
    const heading = sections[i];
    const body = sections[i + 1];
    blocks.push(headingBlock(i === 0 ? "Summary" : heading));
    for (const chunk of chunkText(body, 1800)) {
      blocks.push(paragraphBlock(chunk));
    }
  }
  return blocks;
}

function headingBlock(text) {
  return {
    object: "block",
    type: "heading_2",
    heading_2: {
      rich_text: [richText(text)],
    },
  };
}

function paragraphBlock(text) {
  return {
    object: "block",
    type: "paragraph",
    paragraph: {
      rich_text: [richText(text)],
    },
  };
}

function richText(text) {
  return {
    type: "text",
    text: {
      content: text,
    },
  };
}

function chunkText(text, size) {
  if (!text) {
    return [""];
  }
  const chunks = [];
  for (let index = 0; index < text.length; index += size) {
    chunks.push(text.slice(index, index + size));
  }
  return chunks;
}

module.exports = {
  upsertDailyPage,
  uploadCodexExportToNotion,
  replacePageBlocks,
  createNotionRequest,
  buildCodexExportBlocks,
  createBlocks,
  headingBlock,
  paragraphBlock,
  chunkText,
};
