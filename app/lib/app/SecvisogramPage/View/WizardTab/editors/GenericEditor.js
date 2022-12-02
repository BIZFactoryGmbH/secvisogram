import React from 'react'
import DocumentEditorContext from '../../shared/DocumentEditorContext.js'
import ArrayEditor from './GenericEditor/ArrayEditor.js'
import Attribute from './GenericEditor/Attributes/shared/Attribute.js'
import CweAttribute from './GenericEditor/Attributes/CweAttribute.js'
import DateAttribute from './GenericEditor/Attributes/DateAttribute.js'
import DropdownAttribute from './GenericEditor/Attributes/DropdownAttribute.js'
import IdAttribute from './GenericEditor/Attributes/IdAttribute.js'
import TextAreaAttribute from './GenericEditor/Attributes/TextAreaAttribute.js'
import TextAttribute from './GenericEditor/Attributes/TextAttribute.js'
import ObjectEditor from './GenericEditor/ObjectEditor.js'
import CVSS2Editor from './GenericEditor/CVSS2Editor.js'
import CVSSV3Attribute from './GenericEditor/Attributes/CVSS3Attribute.js'

/**
 * utility function to get the color of circles identifying errors
 *
 * @param {Array<{ instancePath: string; message?: string; type?: string}>} errors
 * @returns {string}
 */
export function getErrorTextColor(errors) {
  const errorTypes = errors.map((e) => e.type)
  return errorTypes.includes('error')
    ? 'text-red-600'
    : errorTypes.includes('warning')
    ? 'text-yellow-600'
    : errorTypes.includes('info')
    ? 'text-blue-600'
    : errors.length
    ? 'text-red-600' // fall back to red if there are errors but their type is not known
    : 'text-green-600'
}

/**
 * @param {object} props
 * @param {import('../shared/types').Property | null} props.parentProperty
 * @param {import('../shared/types').Property} props.property
 * @param {string[]} props.instancePath
 */
export default function Editor({ parentProperty, property, instancePath }) {
  const { doc, collectIds } = React.useContext(DocumentEditorContext)

  const uiType = property.metaData?.uiType
  const label = property.title || property.metaData?.title || 'missing title'
  const description =
    property.description ||
    property.metaData?.description ||
    'missing description'
  /** @type {unknown} */
  const value = instancePath.reduce((value, pathSegment) => {
    return (value ?? {})[pathSegment]
  }, /** @type {Record<string, any> | null} */ (doc))

  if (property.type === 'ARRAY') {
    return <ArrayEditor property={property} instancePath={instancePath} />
  } else if (property.type === 'OBJECT') {
    if (uiType === 'OBJECT_CWE') {
      return (
        <CweAttribute
          label={label}
          description={description}
          property={property}
          instancePath={instancePath}
        />
      )
    } else if (uiType === 'OBJECT_CVSS_2') {
      return (
        <CVSS2Editor
          property={property}
          parentProperty={parentProperty}
          instancePath={instancePath}
          value={value}
        />
      )
    } else if (uiType === 'OBJECT_CVSS_3') {
      return (
        <CVSSV3Attribute
          label={label}
          description={description}
          instancePath={instancePath}
          value={value}
        />
      )
    }
    return (
      <ObjectEditor
        parentProperty={parentProperty}
        property={property}
        instancePath={instancePath}
      />
    )
  } else if (property.type === 'STRING') {
    if (uiType === 'STRING_DATETIME') {
      return (
        <DateAttribute
          label={label}
          description={description}
          instancePath={instancePath}
          value={value || ''}
          property={property}
        />
      )
    } else if (uiType === 'STRING_ENUM') {
      return (
        <DropdownAttribute
          label={label}
          description={description}
          options={/** @type {string[]} */ (property.enum || [])}
          isEnum={true}
          instancePath={instancePath}
          value={value || ''}
          property={property}
        />
      )
    } else if (uiType === 'STRING_WITH_OPTIONS') {
      return (
        <DropdownAttribute
          label={label}
          description={description}
          options={/** @type {string[]} */ (property.metaData?.options || [])}
          isEnum={false}
          instancePath={instancePath}
          value={value || ''}
          property={property}
        />
      )
    } else if (uiType === 'STRING_MULTI_LINE') {
      return (
        <TextAreaAttribute
          label={label}
          description={description}
          minLength={property.minLength || 0}
          required={property.mandatory}
          instancePath={instancePath}
          value={value || ''}
          property={property}
        />
      )
    } else if (uiType === 'STRING_PRODUCT_ID') {
      return (
        <IdAttribute
          label={property.title || ''}
          description={description}
          instancePath={instancePath}
          value={value || ''}
          onCollectIds={collectIds['productIds']}
          property={property}
        />
      )
    } else if (uiType === 'STRING_GROUP_ID') {
      return (
        <IdAttribute
          label={property.title || ''}
          description={description}
          instancePath={instancePath}
          value={value || ''}
          onCollectIds={collectIds['groupIds']}
          property={property}
        />
      )
    } else if (uiType === 'STRING_URI') {
      return (
        <TextAttribute
          label={label}
          description={description}
          minLength={property.minLength || 0}
          type={'url'}
          pattern={property.pattern}
          required={property.mandatory}
          instancePath={instancePath}
          value={value || ''}
          property={property}
        />
      )
    } else {
      return (
        <TextAttribute
          label={label}
          description={description}
          minLength={property.minLength || 0}
          pattern={property.pattern}
          required={property.mandatory}
          instancePath={instancePath}
          value={value || ''}
          property={property}
        />
      )
    }
  } else if (property.type === 'NUMBER') {
    return (
      <Attribute
        description={description}
        instancePath={instancePath}
        label={label}
        property={property}
      >
        {typeof value === 'number' ? String(value) : ''}
      </Attribute>
    )
  } else if (property.type === 'RECURSION') {
    // type is handled in ArrayEditor
    return null
  } else {
    console.log(`unknown type '${property.type}' for ${property.title}`)
    return null
  }
}
