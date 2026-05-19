import React from 'react';
import { useParams } from 'react-router-dom';
import CreateWikiArticle from './CreateWikiArticle';
import EditWikiArticle from './EditWikiArticle';

export default function WikiEditorPage() {
  const { id } = useParams();
  return id ? <EditWikiArticle /> : <CreateWikiArticle />;
}
