import React, { useEffect, useRef, useState } from "react";
import { useGetLeadByIdQuery, useSaveLeadNoteMutation } from "../../features/leads/leadsApiSlice";
import { toast } from "react-toastify";
import "./Notes.css";

const FollowUpNotes = ({ leadId, onClose }) => {
  const dropdownRef = useRef(null);
  const textareaRef = useRef(null);
  const [input, setInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  // RTK Query hooks
  const { data: lead, isLoading, refetch, isFetching } = useGetLeadByIdQuery(leadId, { skip: !leadId });
  const [saveLeadNote, { isLoading: submitting }] = useSaveLeadNoteMutation();

  // Normalize notes from lead data
  const normalizeNotes = (leadData) => {
    if (!leadData) return [];
    if (Array.isArray(leadData.notes)) return leadData.notes;
    if (typeof leadData.notes === 'string' && leadData.notes.trim()) {
      return [{
        message: leadData.notes,
        created_at: leadData.updated_at || leadData.created_at || new Date().toISOString()
      }];
    }
    return [];
  };
  
  const notes = normalizeNotes(lead);

  // Auto-scroll to bottom when new notes are added
  useEffect(() => {
    if (dropdownRef.current) {
      dropdownRef.current.scrollTop = dropdownRef.current.scrollHeight;
    }
  }, [notes]);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  // Send new note
  const handleSendNote = async () => {
    if (!input.trim()) return;
    try {
      await saveLeadNote({ leadId, notes: input.trim() }).unwrap();
      toast.success("Note added successfully");
      setInput("");
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to save note");
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendNote();
    }
  };

  if (isLoading || isFetching) {
    return (
      <div className="fn-modal-backdrop">
        <div className="fn-modal">
          <div className="fn-loading-state">
            <div className="fn-spinner"></div>
            <p>Loading notes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fn-modal-backdrop" onClick={onClose}>
      <div className="fn-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fn-modal-header">
          <div className="fn-header-content">
            <h3>Lead Notes</h3>
            <p className="fn-note-count">{notes.length} {notes.length === 1 ? 'note' : 'notes'}</p>
          </div>
          <button className="fn-close-button" onClick={onClose} aria-label="Close notes">
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="fn-notes-container" ref={dropdownRef}>
          {notes.length > 0 ? (
            <div className="fn-notes-timeline">
              {notes.map((note, index) => (
                <div key={note.id || index} className="fn-note-item">
                  <div className="fn-note-avatar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <div className="fn-note-content">
                    <div className="fn-note-bubble">
                      <p className="fn-note-text">{note.message}</p>
                    </div>
                    <span className="fn-note-date">
                      {new Date(note.created_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="fn-empty-state">
              <div className="fn-empty-illustration">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"></path>
                </svg>
              </div>
              <h4>No notes yet</h4>
              <p>Add your first note to start the conversation</p>
            </div>
          )}
        </div>

        <div className={`fn-input-area ${isExpanded ? 'expanded' : ''}`}>
          <div className="fn-input-wrapper">
            <textarea
              ref={textareaRef}
              placeholder="Type your note here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsExpanded(true)}
              onBlur={() => setIsExpanded(false)}
              disabled={submitting}
              rows={1}
            />
            <button
              onClick={handleSendNote}
              disabled={submitting || !input.trim()}
              className="fn-send-button"
              aria-label="Send note"
            >
              {submitting ? (
                <div className="fn-button-spinner"></div>
              ) : (
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              )}
            </button>
          </div>
          {isExpanded && (
            <div className="fn-input-hint">
              Press <kbd>Enter</kbd> to send, <kbd>Shift</kbd> + <kbd>Enter</kbd> for new line
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowUpNotes;