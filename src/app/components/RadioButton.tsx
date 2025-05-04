"use client";

import * as RadioGroup from "@radix-ui/react-radio-group";

interface RadioButtonProps {
  value: string;
}

export default function RadioButton({ value }: RadioButtonProps) {
  return (
    <RadioGroup.Item
      value={value}
      className="w-6 h-6 rounded-full cursor-pointer data-[state=checked]:bg-pink-500 data-[state=unchecked]:bg-gray-200"
    >
      <RadioGroup.Indicator className="flex items-center justify-center w-full h-full relative after:content-[''] after:block after:w-3 after:h-3 after:rounded-full after:bg-white" />
    </RadioGroup.Item>
  );
}
