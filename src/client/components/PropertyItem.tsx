import React from 'react';
import { PropertyRes } from '@dtos/property.dto';
import PropertyString from './PropertyString';
import PropertyNumber from './PropertyNumber';
import PropertySelect from './PropertySelect';
import PropertyRadio from './PropertyRadio';

const PropertyItem: React.FC<{
  property: PropertyRes;
  value: string;
  editable?: boolean;
  onChange?: (v: any) => void;
}> = ({ property, value, editable = false, onChange = () => {} }) => {
  const form = property.form;
  const options = property.items
    ? Object.entries(property.items).map((item: [string, { color: string; label: string }]) => {
        return { label: item[0], value: item[0] };
      })
    : [];
  switch (form) {
    case 'string':
      return <PropertyString value={value} editable={editable} onChange={onChange} />;
    case 'number':
      return <PropertyNumber value={parseInt(value)} editable={editable} onChange={onChange} />;
    case 'radio':
      return (
        <PropertyRadio options={options} value={value} editable={editable} onChange={onChange} />
      );
    case 'select':
      return (
        <PropertySelect options={options} value={value} editable={editable} onChange={onChange} />
      );
    default:
      return <span></span>;
  }
};

export default PropertyItem;
