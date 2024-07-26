import React from "react";
import { NoteApi } from "lib";
import { useQuery, useQueryClient } from "react-query";
import { useParams } from "react-router-dom";
import { QUERY_KEY } from "utils/constants/queryKey.constants";
import EditableFiles from "components/Editable/EditableFiles";
import EditableToggle from "components/Editable/EditableToggle";
import Editor from "components/Editable/Editor";
import { NoteItemType } from "lib/types";
import EditableInput from "components/Editable/EditableInput";

const NoteSection = () => {
  const { sectionId } = useParams();
  const getNotes = () =>
    NoteApi.list({
      section: sectionId,
      populate: "projects.files,settings.files",
    });
  const { data } = useQuery([QUERY_KEY.NOTE_DETAIL, sectionId], getNotes);
  const queryClient = useQueryClient();

  const handleEditorSetting = async (type: string, noteSection: string) => {
    const note = data?.notes[0];
    if (!note) return;
    const body = {
      name: "",
      type,
      value: "",
      values: [],
    };
    const res = await NoteApi.update(note._id, {
      ...note,
      projects:
        noteSection === "projects" ? [...note.projects, body] : note.projects,
      settings:
        noteSection === "settings" ? [...note.settings, body] : note.settings,
    });
    if (res) {
      queryClient.invalidateQueries(QUERY_KEY.NOTE_DETAIL);
    }
  };

  const handleUpdateApi = async (
    noteItem: NoteItemType,
    noteSection: string
  ) => {
    const note = data?.notes[0];
    if (!note) return;
    if (!noteItem) return;
    let { projects } = note;
    let { settings } = note;
    if (noteSection === "projects") {
      projects = note.projects.map((n) => {
        if (n._id === noteItem._id) {
          return noteItem;
        }
        return n;
      });
    } else if (noteSection === "settings") {
      settings = note.settings.map((n) => {
        if (n._id === noteItem._id) {
          return noteItem;
        }
        return n;
      });
    }
    try {
      const res = await NoteApi.update(note._id, {
        ...note,
        projects,
        settings,
      });
      if (res) {
        queryClient.invalidateQueries(QUERY_KEY.NOTE_DETAIL);
      }
    } catch (error) {
      alert("Fail to update");
    }
  };

  const handleDeleteApi = async (id: string, noteSection: string) => {
    const note = data?.notes[0];
    if (!note) return;
    if (!id) return;
    let { projects } = note;
    let { settings } = note;
    if (noteSection === "projects") {
      projects = note.projects.filter((n) => n._id !== id);
    } else if (noteSection === "settings") {
      settings = note.settings.filter((n) => n._id !== id);
    }
    try {
      const res = await NoteApi.update(note._id, {
        ...note,
        projects,
        settings,
      });
      if (res) {
        queryClient.invalidateQueries(QUERY_KEY.NOTE_DETAIL);
      }
    } catch (error) {
      alert("Fail to delete");
    }
  };

  if (!data?.notes[0]) return null;
  const note = data?.notes[0];
  return (
    <section className="px-10 py-7">
      <div>
        <div className="w-full flex mb-10 justify-between">
          <h2 className="text-base text-white font-normal font-Figtree">
            Project
          </h2>
          <Editor
            onClick={(type: string) => handleEditorSetting(type, "projects")}
          />
        </div>
        {note.projects.map((item: NoteItemType) => {
          let FormComponent = null;
          const formProps = {
            key: item._id,
            data: item,
            className: "mb-2.5",
            isEditLabel: true,
            onUpdateApi: (d: NoteItemType) => handleUpdateApi(d, "projects"),
            onDeleteApi: () => handleDeleteApi(item._id || "", "projects"),
          };
          if (item.type === "single_text") FormComponent = EditableInput;
          if (item.type === "multi_text") {
            return (
              <EditableInput
                {...formProps}
                isMultiLine
                editorClassName="mb-2.5"
              />
            );
          }
          if (item.type === "file") FormComponent = EditableFiles;
          if (item.type === "toggle") FormComponent = EditableToggle;
          return FormComponent ? <FormComponent {...formProps} /> : null;
        })}
      </div>
      <div className="mt-10">
        <div className="w-full flex mb-10 justify-between">
          <h2 className="text-base text-white font-normal font-Figtree">
            Setting
          </h2>
          <Editor
            onClick={(type: string) => handleEditorSetting(type, "settings")}
          />
        </div>
        {note.settings.map((item: NoteItemType) => {
          let FormComponent = null;
          const formProps = {
            key: item._id,
            data: item,
            className: "mb-2.5",
            isEditLabel: true,
            onUpdateApi: (d: NoteItemType) => handleUpdateApi(d, "settings"),
            onDeleteApi: () => handleDeleteApi(item._id || "", "settings"),
          };
          if (item.type === "single_text") FormComponent = EditableInput;
          if (item.type === "multi_text") {
            return (
              <EditableInput
                {...formProps}
                isMultiLine
                editorClassName="mb-2.5"
              />
            );
          }
          if (item.type === "file") FormComponent = EditableFiles;
          if (item.type === "toggle") FormComponent = EditableToggle;
          return FormComponent ? <FormComponent {...formProps} /> : null;
        })}
      </div>
    </section>
  );
};

export default NoteSection;
