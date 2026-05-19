import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import noteApi from '../../api/note.api';
import NoteEditorForm from '../../components/notes/NoteEditor';

const getWorkspaceId = (workspace) => workspace?._id || workspace?.id || workspace || null;

const emptyNote = { title: '', noteType: 'general', visibility: 'private', tags: [], plainText: '' };

const NoteEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { workspace, user } = useAuthStore();
  const workspaceId = getWorkspaceId(workspace) || getWorkspaceId(user?.defaultWorkspace);
  const [note, setNote] = useState(emptyNote);

  useEffect(() => {
    if (workspaceId && id) noteApi.get(workspaceId, id).then((res) => setNote(res.note || res.data)).catch(() => {});
  }, [workspaceId, id]);

  const save = async () => {
    const payload = { ...note, content: note.plainText, contentHtml: note.plainText };
    const res = id ? await noteApi.update(workspaceId, id, payload) : await noteApi.create(workspaceId, payload);
    toast.success('Note saved');
    navigate(`/notes/${(res.note || res.data)._id}`);
  };

  return (
    <main className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">{id ? 'Edit Note' : 'Create Note'}</h1>
        <button type="button" onClick={save} className="rounded bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Save</button>
      </header>
      <NoteEditorForm value={note} onChange={setNote} />
    </main>
  );
};

export default NoteEditor;
