import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import noteApi from '../../api/note.api';
import NoteCard from '../../components/notes/NoteCard';
import NoteSidebar from '../../components/notes/NoteSidebar';

const getWorkspaceId = (workspace) => workspace?._id || workspace?.id || workspace || null;

const NoteList = () => {
  const navigate = useNavigate();
  const { workspace, user } = useAuthStore();
  const workspaceId = getWorkspaceId(workspace) || getWorkspaceId(user?.defaultWorkspace);
  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState([]);
  const [folder, setFolder] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!workspaceId) return;
    noteApi.list(workspaceId, { folder, search }).then((res) => setNotes(res.notes || res.data || [])).catch(() => {});
    noteApi.folders(workspaceId).then((res) => setFolders(res.folders || res.data || [])).catch(() => {});
  }, [workspaceId, folder, search]);

  return (
    <main className="space-y-4">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Notes</h1>
          <p className="mt-1 text-sm text-slate-600">{notes.length} notes</p>
        </div>
        <button type="button" onClick={() => navigate('/notes/new')} className="rounded bg-slate-950 px-4 py-2 text-sm font-semibold text-white">New note</button>
      </header>
      <div className="grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <NoteSidebar folders={folders} activeFolder={folder} onSelect={setFolder} />
        <section className="space-y-3">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search notes" className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {notes.map((note) => <NoteCard key={note._id} note={note} onClick={(item) => navigate(`/notes/${item._id}`)} />)}
          </div>
        </section>
      </div>
    </main>
  );
};

export default NoteList;
