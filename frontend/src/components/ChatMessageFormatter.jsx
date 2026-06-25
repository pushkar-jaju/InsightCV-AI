import React from 'react'

// Convert inline markdown styles: **bold**, *italic*, `code`, [link](url)
function parseInlineFormatting(text) {
  if (!text) return ''

  const tokens = []
  let index = 0

  while (index < text.length) {
    const boldIndex = text.indexOf('**', index)
    const italicIndex = text.indexOf('*', index)
    const codeIndex = text.indexOf('`', index)
    const linkIndex = text.indexOf('[', index)

    const nextSpecial = [boldIndex, italicIndex, codeIndex, linkIndex]
      .filter(idx => idx !== -1)
      .sort((a, b) => a - b)[0]

    if (nextSpecial === undefined) {
      tokens.push(text.substring(index))
      break
    }

    if (nextSpecial > index) {
      tokens.push(text.substring(index, nextSpecial))
    }

    if (nextSpecial === boldIndex) {
      const closing = text.indexOf('**', boldIndex + 2)
      if (closing !== -1) {
        tokens.push(
          <strong key={`bold-${boldIndex}`} className="font-bold text-gray-905 dark:text-white">
            {text.substring(boldIndex + 2, closing)}
          </strong>
        )
        index = closing + 2
      } else {
        tokens.push('**')
        index = boldIndex + 2
      }
    } else if (nextSpecial === italicIndex) {
      const closing = text.indexOf('*', italicIndex + 1)
      if (closing !== -1) {
        tokens.push(
          <em key={`italic-${italicIndex}`} className="italic text-gray-800 dark:text-gray-200">
            {text.substring(italicIndex + 1, closing)}
          </em>
        )
        index = closing + 1
      } else {
        tokens.push('*')
        index = italicIndex + 1
      }
    } else if (nextSpecial === codeIndex) {
      const closing = text.indexOf('`', codeIndex + 1)
      if (closing !== -1) {
        tokens.push(
          <code key={`code-${codeIndex}`} className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-900 font-mono text-[13px] text-indigo-600 dark:text-indigo-400 border border-gray-200 dark:border-gray-800">
            {text.substring(codeIndex + 1, closing)}
          </code>
        )
        index = closing + 1
      } else {
        tokens.push('`')
        index = codeIndex + 1
      }
    } else if (nextSpecial === linkIndex) {
      const closingText = text.indexOf(']', linkIndex + 1)
      if (closingText !== -1 && text.charAt(closingText + 1) === '(') {
        const closingUrl = text.indexOf(')', closingText + 2)
        if (closingUrl !== -1) {
          const linkText = text.substring(linkIndex + 1, closingText)
          const linkUrl = text.substring(closingText + 2, closingUrl)
          tokens.push(
            <a
              key={`link-${linkIndex}`}
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-650 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold underline decoration-2 underline-offset-2 transition-colors"
            >
              {linkText}
            </a>
          )
          index = closingUrl + 1
          continue
        }
      }
      tokens.push('[')
      index = linkIndex + 1
    }
  }

  return tokens
}

// Custom helper to parse Markdown tables containing pipe symbols
function parseTableLines(tableLines) {
  if (tableLines.length < 2) return null

  const parseRow = (rowText) => {
    const parts = rowText.split('|')
    const cells = parts.map(p => p.trim())
    // Remove leading/trailing empty cells if the row was wrapped in pipes
    if (parts[0] !== undefined && parts[0].trim() === '') {
      cells.shift()
    }
    if (parts[parts.length - 1] !== undefined && parts[parts.length - 1].trim() === '') {
      cells.pop()
    }
    return cells
  }

  const headers = parseRow(tableLines[0])
  const rows = []

  // Skip tableLines[1] because it is the separator row
  for (let idx = 2; idx < tableLines.length; idx++) {
    const cells = parseRow(tableLines[idx])
    // If cells are empty or just dashes, skip it
    if (cells.length === 0 || cells.every(c => /^[-:]+$/.test(c) || c === '')) continue
    rows.push(cells)
  }

  return { headers, rows }
}

// Custom simple parser for normal markdown formatting
function parseMarkdownText(text) {
  const lines = text.split('\n')
  const elements = []
  let listItems = []
  let listType = null // 'bullet' | 'number'

  const flushList = (key) => {
    if (listItems.length === 0) return null
    const listKey = `list-${key}`
    const items = [...listItems]
    listItems = []
    
    if (listType === 'bullet') {
      listType = null
      return (
        <ul key={listKey} className="list-disc pl-5 space-y-1 my-1.5 text-gray-800 dark:text-gray-200">
          {items.map((item, idx) => (
            <li key={idx} className="pl-0.5 leading-relaxed text-[15px]">{parseInlineFormatting(item)}</li>
          ))}
        </ul>
      )
    } else if (listType === 'number') {
      listType = null
      return (
        <ol key={listKey} className="list-decimal pl-5 space-y-1 my-1.5 text-gray-800 dark:text-gray-200">
          {items.map((item, idx) => (
            <li key={idx} className="pl-0.5 leading-relaxed text-[15px]">{parseInlineFormatting(item)}</li>
          ))}
        </ol>
      )
    }
    return null
  }

  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const trimmedLine = line.trim()

    // Check if this line starts a table.
    const nextLine = (i + 1 < lines.length) ? lines[i + 1].trim() : ''
    const isCurrentTableLine = line.includes('|')
    const isNextSeparator = nextLine.includes('|') && nextLine.split('|').map(s => s.trim()).filter(Boolean).every(s => /^:-+:?$/.test(s) || /^-+$/.test(s))

    if (isCurrentTableLine && isNextSeparator) {
      // Flush any active lists first
      elements.push(flushList(i))

      // Collect all consecutive table lines
      const tableLines = []
      while (i < lines.length && lines[i].includes('|')) {
        tableLines.push(lines[i])
        i++
      }

      // Parse the table
      const parsedTable = parseTableLines(tableLines)
      if (parsedTable) {
        const { headers, rows } = parsedTable
        const tableKey = `table-${i}`

        if (headers.length >= 3) {
          // Render 3+ columns as cards
          elements.push(
            <div key={tableKey} className="space-y-3 my-3">
              {rows.map((row, rowIdx) => {
                const mainVal = row[0] || ''
                const details = row.slice(1)
                return (
                  <div key={rowIdx} className="bg-gray-50/50 dark:bg-gray-900/40 border border-gray-200/60 dark:border-gray-800/85 p-3.5 rounded-xl shadow-xs space-y-1.5 text-left animate-fade-in">
                    <div className="font-bold text-gray-905 dark:text-white text-[15px] border-b border-gray-200/50 dark:border-gray-800/60 pb-1">
                      {parseInlineFormatting(mainVal)}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 pt-0.5">
                      {details.map((val, colIdx) => {
                        const headerName = headers[colIdx + 1] || `Col ${colIdx + 2}`
                        return (
                          <div key={colIdx} className="text-[13px] flex items-baseline gap-1.5">
                            <span className="text-gray-400 dark:text-gray-500 font-semibold">{headerName}:</span>
                            <span className="text-gray-800 dark:text-gray-200">{parseInlineFormatting(val)}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        } else if (headers.length === 2) {
          // Render 2 columns as a clean definition list card
          elements.push(
            <div key={tableKey} className="space-y-2.5 my-3 p-3.5 bg-gray-50/30 dark:bg-gray-900/20 border border-gray-200/40 dark:border-gray-800/40 rounded-xl animate-fade-in">
              {rows.map((row, rowIdx) => {
                const key = row[0] || ''
                const val = row[1] || ''
                return (
                  <div key={rowIdx} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 py-1.5 border-b border-gray-200/30 dark:border-gray-800/20 last:border-b-0 text-[15px]">
                    <span className="font-bold text-gray-950 dark:text-white sm:min-w-[140px] shrink-0 text-left">
                      {parseInlineFormatting(key)}
                    </span>
                    <span className="text-gray-850 dark:text-gray-300 text-left">
                      {parseInlineFormatting(val)}
                    </span>
                  </div>
                )
              })}
            </div>
          )
        } else {
          // 1 column: bullet items
          elements.push(
            <ul key={tableKey} className="list-disc pl-5 space-y-1 my-2 text-gray-800 dark:text-gray-200">
              {rows.map((row, rowIdx) => (
                <li key={rowIdx} className="pl-0.5 leading-relaxed text-[15px]">
                  {parseInlineFormatting(row[0] || '')}
                </li>
              ))}
            </ul>
          )
        }
      }
      continue
    }

    // 0. Horizontal Rule (---)
    if (/^[-*_]{3,}$/.test(trimmedLine)) {
      elements.push(flushList(i))
      elements.push(
        <hr key={i} className="border-gray-200 dark:border-gray-800 my-3" />
      )
      i++
      continue
    }

    // 1. Heading 1 (# title) - max 18px
    if (trimmedLine.startsWith('# ')) {
      elements.push(flushList(i))
      elements.push(
        <h1 key={i} className="text-[17px] font-bold text-gray-900 dark:text-white mt-4 mb-2 tracking-tight">
          {parseInlineFormatting(trimmedLine.substring(2))}
        </h1>
      )
      i++
      continue
    }

    // 2. Heading 2 (## subtitle) - max 18px
    if (trimmedLine.startsWith('## ')) {
      elements.push(flushList(i))
      elements.push(
        <h2 key={i} className="text-[16px] font-bold text-gray-900 dark:text-white mt-3.5 mb-1.5 tracking-tight border-b border-gray-200 dark:border-gray-700/50 pb-0.5">
          {parseInlineFormatting(trimmedLine.substring(3))}
        </h2>
      )
      i++
      continue
    }

    // 3. Heading 3 (### section) - max 18px
    if (trimmedLine.startsWith('### ')) {
      elements.push(flushList(i))
      elements.push(
        <h3 key={i} className="text-[15px] font-bold text-gray-900 dark:text-white mt-3 mb-1">
          {parseInlineFormatting(trimmedLine.substring(4))}
        </h3>
      )
      i++
      continue
    }

    // 4. Bullet List Item (* or -)
    if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ') || trimmedLine.startsWith('• ')) {
      if (listType !== 'bullet') {
        elements.push(flushList(i))
        listType = 'bullet'
      }
      listItems.push(trimmedLine.substring(2))
      i++
      continue
    }

    // 5. Numbered List Item (1., 2.)
    if (/^\d+\.\s+/.test(trimmedLine)) {
      if (listType !== 'number') {
        elements.push(flushList(i))
        listType = 'number'
      }
      listItems.push(trimmedLine.replace(/^\d+\.\s+/, ''))
      i++
      continue
    }

    // 6. Callout boxes / blockquotes (starts with >)
    if (trimmedLine.startsWith('>')) {
      elements.push(flushList(i))
      elements.push(
        <div key={i} className="p-3 my-2.5 border-l-4 border-indigo-500 bg-gray-50/50 dark:bg-gray-900/40 rounded-r-lg text-[15px] italic text-gray-700 dark:text-gray-300">
          {parseInlineFormatting(trimmedLine.replace(/^>\s*/, ''))}
        </div>
      )
      i++
      continue
    }

    // 7. Regular paragraph line
    if (trimmedLine.length > 0) {
      if (listType) {
        listItems.push(trimmedLine)
      } else {
        elements.push(
          <p key={i} className="text-gray-800 dark:text-gray-200 text-[15px] leading-relaxed my-1.5">
            {parseInlineFormatting(trimmedLine)}
          </p>
        )
      }
    }
    i++
  }

  // Flush remaining list items
  elements.push(flushList(lines.length))

  return elements.filter(Boolean)
}

export default function ChatMessageFormatter({ text }) {
  if (!text) return null

  return (
    <div className="space-y-1.5 text-[15px] leading-relaxed text-gray-800 dark:text-gray-200 text-left">
      {parseMarkdownText(text)}
    </div>
  )
}
