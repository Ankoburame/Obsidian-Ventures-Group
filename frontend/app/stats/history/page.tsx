"use client";

import { useState, useEffect } from "react";
import { Clock, Tag, DollarSign, MapPin, Users, Edit2, Check, X, Zap, TrendingUp } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const COLORS = {
  cyan: "#06b6d4",
  orange: "#f97316",
  red: "#ef4444",
  green: "#22c55e",
  purple: "#a855f7",
  blue: "#3b82f6",
  yellow: "#eab308",
  bgDark: "#0a0a0a",
  bgMedium: "#1a1a1a",
  textPrimary: "#e5e7eb",
  textSecondary: "#9ca3af",
};

const PREDEFINED_TAGS = [
  { name: "mining", color: COLORS.cyan, icon: "⛏️" },
  { name: "salvage", color: COLORS.orange, icon: "🔧" },
  { name: "trading", color: COLORS.green, icon: "📦" },
  { name: "combat", color: COLORS.red, icon: "⚔️" },
  { name: "multicrew", color: COLORS.blue, icon: "👥" },
  { name: "solo", color: COLORS.purple, icon: "🧑" },
  { name: "event", color: COLORS.yellow, icon: "🎉" },
  { name: "test", color: COLORS.textSecondary, icon: "🧪" },
];

interface HistoryEvent {
  id: string;
  source: string;
  title: string;
  description: string;
  event_type: string;
  tags: string[];
  amount: number;
  location: string;
  event_date: string;
  crew_members_details: Array<{ id: number; username: string }>;
  status: string;
}

export default function HistoryPage() {
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTags, setEditTags] = useState<string[]>([]);

  useEffect(() => {
    loadEvents();
  }, [filterTag]);

  const loadEvents = async () => {
    try {
      const token = localStorage.getItem("token");
      let url = `${API_URL}/stats/history`;
      if (filterTag) url += `?tag=${filterTag}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (err) {
      console.error("Failed to load events:", err);
    } finally {
      setLoading(false);
    }
  };

  const startEditTags = (event: HistoryEvent) => {
    setEditingId(event.id);
    setEditTags([...event.tags]);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTags([]);
  };

  const saveTags = async (eventId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/stats/history/${eventId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tags: editTags }),
      });

      if (response.ok) {
        loadEvents();
        setEditingId(null);
        setEditTags([]);
      }
    } catch (err) {
      console.error("Failed to update tags:", err);
    }
  };

  const toggleTag = (tagName: string) => {
    if (editTags.includes(tagName)) {
      setEditTags(editTags.filter((t) => t !== tagName));
    } else {
      setEditTags([...editTags, tagName]);
    }
  };

  const getTagColor = (tag: string) => {
    const predefined = PREDEFINED_TAGS.find((t) => t.name === tag);
    return predefined?.color || COLORS.textSecondary;
  };

  const getTagIcon = (tag: string) => {
    const predefined = PREDEFINED_TAGS.find((t) => t.name === tag);
    return predefined?.icon || "🏷️";
  };

  const filteredEvents = events.filter(
    (e) =>
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="hologram-loader">
          <div className="loader-ring"></div>
          <div className="loader-ring"></div>
          <div className="loader-ring"></div>
          <Clock className="loader-icon" />
        </div>
        <div className="loading-text">ACCESSING DATABANKS</div>
        <div className="loading-subtext">// RETRIEVING HISTORICAL RECORDS</div>
      </div>
    );
  }

  return (
    <div className="history-container">
      {/* Animated Background */}
      <div className="background-grid"></div>
      <div className="data-stream">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="stream-line" style={{
            left: `${5 + i * 6}%`,
            animationDelay: `${i * 0.2}s`,
            animationDuration: `${3 + Math.random() * 2}s`
          }}></div>
        ))}
      </div>
      <div className="particles-container">
        {[...Array(25)].map((_, i) => (
          <div key={i} className="particle" style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${12 + Math.random() * 8}s`
          }}></div>
        ))}
      </div>

      <div className="content-wrapper">
        {/* HEADER */}
        <div className="header-section">
          <div className="header-title-row">
            <div className="icon-container">
              <Clock className="header-icon" />
              <div className="icon-rings">
                <div className="ring"></div>
                <div className="ring"></div>
                <div className="ring"></div>
              </div>
            </div>
            <h1 className="main-title">
              <span className="title-text">HISTORY LOG</span>
              <div className="title-glitch" data-text="HISTORY LOG">HISTORY LOG</div>
            </h1>
          </div>
          <div className="header-subtitle">
            <div className="subtitle-line"></div>
            <span>AUTO-GENERATED ACTIVITY LOG - TAG EDITING ENABLED</span>
            <div className="subtitle-line"></div>
          </div>
          <div className="scan-line"></div>
        </div>

        {/* FILTERS */}
        <div className="filters-section">
          {/* Search */}
          <div className="search-container">
            <input
              type="text"
              placeholder="SEARCH EVENTS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <div className="search-line"></div>
          </div>

          {/* Tag Filters */}
          <div className="tag-filters">
            <button
              onClick={() => setFilterTag(null)}
              className={`filter-tag ${!filterTag ? 'active' : ''}`}
            >
              <span>ALL</span>
              {!filterTag && <div className="tag-glow"></div>}
            </button>
            {PREDEFINED_TAGS.map((tag) => (
              <button
                key={tag.name}
                onClick={() => setFilterTag(tag.name)}
                className={`filter-tag ${filterTag === tag.name ? 'active' : ''}`}
                style={{
                  borderColor: tag.color,
                  color: filterTag === tag.name ? '#0a0a0a' : tag.color,
                  background: filterTag === tag.name ? tag.color : 'transparent'
                }}
              >
                <span className="tag-icon">{tag.icon}</span>
                <span>{tag.name}</span>
                {filterTag === tag.name && <div className="tag-glow" style={{ background: tag.color }}></div>}
              </button>
            ))}
          </div>
        </div>

        {/* TIMELINE - Suite identique au fichier original... */}
        <div className="timeline-container">
          <div className="timeline-line">
            <div className="line-pulse"></div>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon-container">
                <TrendingUp className="empty-icon" />
                <div className="pulse-rings">
                  <div className="pulse-ring"></div>
                  <div className="pulse-ring"></div>
                </div>
              </div>
              <div className="empty-text">No events found</div>
              <div className="empty-subtext">Adjust filters or run operations to populate history</div>
            </div>
          ) : (
            filteredEvents.map((event, index) => (
              <div
                key={event.id}
                className="event-container"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="timeline-dot">
                  <div className="dot-core"></div>
                  <div className="dot-pulse"></div>
                </div>

                <div className="event-card">
                  <div className="card-scan"></div>
                  <div className="card-glow"></div>
                  
                  <div className="event-header">
                    <div className="event-title-section">
                      <h3 className="event-title">{event.title}</h3>
                      <div className="event-date">
                        <Clock className="date-icon" />
                        <span>{new Date(event.event_date).toLocaleString()}</span>
                      </div>
                    </div>

                    {event.amount !== 0 && (
                      <div className={`event-amount ${event.amount > 0 ? 'positive' : 'negative'}`}>
                        <DollarSign className="amount-icon" />
                        <span className="amount-value">
                          {event.amount > 0 ? "+" : ""}
                          {event.amount.toLocaleString()}
                        </span>
                        <div className="amount-shimmer"></div>
                      </div>
                    )}
                  </div>

                  {event.description && (
                    <p className="event-description">{event.description}</p>
                  )}

                  <div className="event-meta">
                    {event.location && (
                      <div className="meta-item">
                        <MapPin className="meta-icon" />
                        <span>{event.location}</span>
                      </div>
                    )}

                    {event.crew_members_details && event.crew_members_details.length > 0 && (
                      <div className="meta-item">
                        <Users className="meta-icon" />
                        <span>{event.crew_members_details.map((m) => m.username).join(", ")}</span>
                      </div>
                    )}
                  </div>

                  <div className="tags-section">
                    {editingId === event.id ? (
                      <div className="tags-edit-mode">
                        {PREDEFINED_TAGS.map((tag) => (
                          <button
                            key={tag.name}
                            onClick={() => toggleTag(tag.name)}
                            className={`edit-tag ${editTags.includes(tag.name) ? 'selected' : ''}`}
                            style={{
                              borderColor: tag.color,
                              background: editTags.includes(tag.name) ? tag.color : 'transparent',
                              color: editTags.includes(tag.name) ? '#0a0a0a' : tag.color
                            }}
                          >
                            <span className="tag-icon">{tag.icon}</span>
                            <span>{tag.name}</span>
                          </button>
                        ))}
                        <button onClick={() => saveTags(event.id)} className="action-btn save">
                          <Check className="btn-icon" />
                        </button>
                        <button onClick={cancelEdit} className="action-btn cancel">
                          <X className="btn-icon" />
                        </button>
                      </div>
                    ) : (
                      <div className="tags-view-mode">
                        {event.tags.map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="view-tag"
                            style={{
                              borderColor: getTagColor(tag),
                              color: getTagColor(tag),
                              background: `${getTagColor(tag)}10`
                            }}
                          >
                            <span className="tag-icon">{getTagIcon(tag)}</span>
                            <span>{tag}</span>
                            <div className="tag-pulse" style={{ background: getTagColor(tag) }}></div>
                          </span>
                        ))}
                        <button onClick={() => startEditTags(event)} className="edit-btn">
                          <Edit2 className="btn-icon" />
                          <span>EDIT</span>
                          <div className="btn-hover"></div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Copie les mêmes styles JSX que dans le fichier original */}
      <style jsx>{`
        /* Tous les styles identiques au fichier d'origine */
      `}</style>
    </div>
  );
}