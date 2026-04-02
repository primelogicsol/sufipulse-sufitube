"use client";
import { useState } from "react";
import Editor, {
    EditorProvider,
} from "react-simple-wysiwyg";

export default function FullEditor() {
    const [value, setValue] = useState("");
    const onChange = (e: any) => setValue(e.target.value);

    return (
        <EditorProvider>
            <Editor value={value} onChange={onChange}
                className="bg-white text-black"
                style={{ minHeight: "300px", maxHeight: "600px", overflowY: "auto" }}
            >            
            </Editor>
        </EditorProvider>
    );
}