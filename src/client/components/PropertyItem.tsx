import React from "react";
import { PropertyRes } from "@dtos/property.dto";
import PropertyString from "./PropertyString";
import PropertyNumber from "./PropertyNumber";
import PropertySelect from "./PropertySelect";
import PropertyRadio from "./PropertyRadio";

const PropertyItem: React.FC<{
  property: PropertyRes;
  value: string;
  editable?: boolean;
  onChange?: (v: any) => void;
}> = ({ property, value, editable = false, onChange = () => {} }) => {
  const form = property.form;
  switch (form) {
    case "string":
      return (
        <PropertyString value={value} editable={editable} onChange={onChange} />
      );
    case "number":
      return (
        <PropertyNumber value={parseInt(value)} editable={editable} onChange={onChange} />
      );
    case "radio":
      return (
        <PropertyRadio
          items={property.items}
          value={value}
          editable={editable}
          onChange={onChange}
        />
      );
    case "select":
      return (
        <PropertySelect
          items={property.items}
          value={value}
          editable={editable}
          onChange={onChange}
        />
      );
    default:
      return <span></span>;
  }
};

export default PropertyItem;
