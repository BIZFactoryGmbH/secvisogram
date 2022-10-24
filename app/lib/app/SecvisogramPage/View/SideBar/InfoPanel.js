import React, { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons'
import { marked } from 'marked'

import metadata from '../../../../../../data/metaData2.json'

/**
 * Defines the content of the side bar displaying documentation of a selected path
 *
 * @param {{
 *   selectedPath: string[]
 * }} props
 */
export default function InfoPanel({ selectedPath }) {
  const [mdText, setMdText] = useState('')

  const addInernalDocuPrefix = (/** @type string */ htmlString) =>
    // adds the required prefix to all internal links
    htmlString.replace(/href="(?!http|#)/g, 'href="/docs/user/')

  const getRenderedMarkdown = () => {
    const jsonPath = `$.${selectedPath.join('.')}`
    if (jsonPath in metadata) {
      // @ts-ignore
      const meta = metadata[jsonPath]
      const usage_path = meta.user_documentation.usage.generic
      fetch(usage_path)
        .then((resp) => resp.text())
        .then((mdText) => {
          const rendered = marked(mdText)
          setMdText(addInernalDocuPrefix(rendered))
        })
    }
  }

  useEffect(getRenderedMarkdown, [selectedPath])

  const getIFrameHistory = () => {
    const iFrame = /** @type { HTMLIFrameElement } */ (
      document.getElementById('iframe')
    )
    if (isIFrame(iFrame) && iFrame.contentWindow) {
      return iFrame.contentWindow.history
    }
  }
  const isIFrame = (/** @type HTMLIFrameElement | null */ input) =>
    input !== null && input.tagName === 'IFRAME'

  return (
    <>
      <button
        type="button"
        onClick={() => {
          getIFrameHistory()?.back()
        }}
      >
        <FontAwesomeIcon className="fa-1x" icon={faArrowLeft} /> Back
      </button>
      ||
      <button
        type="button"
        onClick={() => {
          getIFrameHistory()?.forward()
        }}
      >
        Forward <FontAwesomeIcon className="fa-1x" icon={faArrowRight} />
      </button>
      <iframe id="iframe" className="w-full h-full" srcDoc={mdText} />
    </>
  )
}
