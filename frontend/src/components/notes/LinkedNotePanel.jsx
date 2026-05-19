import NoteCard from './NoteCard';

const LinkedNotePanel = ({ notes = [], onOpen }) => (
  <div className="grid gap-3 md:grid-cols-2">
    {notes.map((note) => <NoteCard key={note._id} note={note} onClick={onOpen} />)}
  </div>
);

export default LinkedNotePanel;
