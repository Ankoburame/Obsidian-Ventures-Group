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
  { name: "refining", color: COLORS.purple, icon: "⚙️" },
  { name: "trading", color: COLORS.green, icon: "📦" },
  { name: "salvage", color: COLORS.orange, icon: "🔧" },
  { name: "combat", color: COLORS.red, icon: "⚔️" },
  { name: "profit", color: COLORS.green, icon: "💰" },
  { name: "loss", color: COLORS.red, icon: "💸" },
  { name: "cost", color: COLORS.orange, icon: "💵" },
  { name: "crew", color: COLORS.blue, icon: "👥" },
];

interface HistoryEvent {
  id: number;
  title: string;
  description: string;
  event_type: string;
  tags: string[];
  amount: number;
  location: string;
  event_date: string;
  crew_members_details: Array<{ id: number; username: string }>;
}

export default function HistoryPage() {
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
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

  const saveTags = async (eventId: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/stats/history/${eventId}`, {
        method: "PUT",
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

        {/* TIMELINE */}
        <div className="timeline-container">
          {/* Timeline Line with Pulse */}
          <div className="timeline-line">
            <div className="line-pulse"></div>
          </div>

          {/* Events */}
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
                {/* Timeline Dot */}
                <div className="timeline-dot">
                  <div className="dot-core"></div>
                  <div className="dot-pulse"></div>
                </div>

                {/* Event Card */}
                <div className="event-card">
                  <div className="card-scan"></div>
                  <div className="card-glow"></div>
                  
                  {/* Header */}
                  <div className="event-header">
                    <div className="event-title-section">
                      <h3 className="event-title">{event.title}</h3>
                      <div className="event-date">
                        <Clock className="date-icon" />
                        <span>{new Date(event.event_date).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Amount */}
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

                  {/* Description */}
                  {event.description && (
                    <p className="event-description">{event.description}</p>
                  )}

                  {/* Meta Info */}
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

                  {/* Tags */}
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

      <style jsx>{`
        .history-container {
          min-height: 100vh;
          background: #0a0a0a;
          padding: 32px;
          position: relative;
          overflow: hidden;
        }

        /* Animated Background */
        .background-grid {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            linear-gradient(rgba(6, 182, 212, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.02) 1px, transparent 1px);
          background-size: 60px 60px;
          animation: gridMove 30s linear infinite;
          pointer-events: none;
        }

        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(60px, 60px); }
        }

        .data-stream {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .stream-line {
          position: absolute;
          top: -100%;
          width: 1px;
          height: 100px;
          background: linear-gradient(180deg, transparent, #06b6d4, transparent);
          animation: streamFall linear infinite;
          opacity: 0.3;
        }

        @keyframes streamFall {
          to { transform: translateY(100vh); }
        }

        .particles-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .particle {
          position: absolute;
          width: 2px;
          height: 2px;
          background: #06b6d4;
          border-radius: 50%;
          animation: particleFloat linear infinite;
          box-shadow: 0 0 6px #06b6d4;
        }

        @keyframes particleFloat {
          0% {
            transform: translateY(100vh) translateX(0) scale(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
            transform: scale(1);
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100px) translateX(50px) scale(0);
            opacity: 0;
          }
        }

        .content-wrapper {
          max-width: 1400px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        /* Header */
        .header-section {
          margin-bottom: 48px;
          position: relative;
        }

        .header-title-row {
          display: flex;
          align-items: center;
          gap: 24px;
          margin-bottom: 16px;
        }

        .icon-container {
          position: relative;
          width: 70px;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .header-icon {
          width: 36px;
          height: 36px;
          color: #06b6d4;
          position: relative;
          z-index: 3;
          filter: drop-shadow(0 0 10px #06b6d4);
          animation: iconPulse 3s ease-in-out infinite;
        }

        @keyframes iconPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .icon-rings {
          position: absolute;
          inset: 0;
        }

        .ring {
          position: absolute;
          inset: 0;
          border: 2px solid #06b6d4;
          border-radius: 50%;
          animation: ringExpand 3s ease-out infinite;
        }

        .ring:nth-child(2) { animation-delay: 1s; }
        .ring:nth-child(3) { animation-delay: 2s; }

        @keyframes ringExpand {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }

        .main-title {
          position: relative;
          margin: 0;
        }

        .title-text {
          font-size: 56px;
          font-weight: 700;
          letter-spacing: 8px;
          background: linear-gradient(90deg, #06b6d4 0%, #0891b2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          display: inline-block;
          position: relative;
          z-index: 2;
        }

        .title-glitch {
          position: absolute;
          top: 0;
          left: 0;
          font-size: 56px;
          font-weight: 700;
          letter-spacing: 8px;
          color: #06b6d4;
          opacity: 0;
          animation: glitch 5s infinite;
          pointer-events: none;
        }

        @keyframes glitch {
          0%, 90%, 100% { opacity: 0; transform: translate(0); }
          92% { opacity: 0.8; transform: translate(-2px, 2px); }
          94% { opacity: 0.8; transform: translate(2px, -2px); }
          96% { opacity: 0.8; transform: translate(-2px, -2px); }
        }

        .header-subtitle {
          display: flex;
          align-items: center;
          gap: 16px;
          color: #9ca3af;
          font-size: 12px;
          letter-spacing: 3px;
          text-transform: uppercase;
          font-weight: 600;
        }

        .subtitle-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, #06b6d4, transparent);
        }

        .scan-line {
          position: absolute;
          bottom: -12px;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #06b6d4, #22c55e, #06b6d4, transparent);
          animation: scanMove 4s linear infinite;
          filter: blur(1px);
        }

        @keyframes scanMove {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        /* Filters Section */
        .filters-section {
          margin-bottom: 40px;
        }

        .search-container {
          position: relative;
          margin-bottom: 20px;
        }

        .search-input {
          width: 100%;
          padding: 16px 20px;
          background: rgba(26, 26, 26, 0.8);
          border: 2px solid rgba(6, 182, 212, 0.3);
          border-radius: 12px;
          color: #e5e7eb;
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 1px;
          outline: none;
          transition: all 0.3s;
          backdrop-filter: blur(10px);
        }

        .search-input:focus {
          border-color: #06b6d4;
          box-shadow: 0 0 20px rgba(6, 182, 212, 0.2);
        }

        .search-input::placeholder {
          color: #9ca3af;
          letter-spacing: 2px;
        }

        .search-line {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, #06b6d4, #22c55e);
          transition: width 0.3s;
        }

        .search-input:focus + .search-line {
          width: 100%;
        }

        .tag-filters {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .filter-tag {
          padding: 10px 18px;
          background: transparent;
          border: 2px solid;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          text-transform: uppercase;
          letter-spacing: 1px;
          display: flex;
          align-items: center;
          gap: 6px;
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .filter-tag:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
        }

        .filter-tag.active {
          transform: scale(1.05);
        }

        .tag-icon {
          font-size: 14px;
        }

        .tag-glow {
          position: absolute;
          inset: -2px;
          background: inherit;
          filter: blur(8px);
          opacity: 0.6;
          z-index: -1;
        }

        /* Timeline */
        .timeline-container {
          position: relative;
          padding-left: 50px;
        }

        .timeline-line {
          position: absolute;
          left: 16px;
          top: 0;
          bottom: 0;
          width: 3px;
          background: linear-gradient(180deg, #06b6d4 0%, rgba(6, 182, 212, 0.3) 50%, transparent 100%);
          border-radius: 2px;
        }

        .line-pulse {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 40px;
          background: linear-gradient(180deg, #06b6d4, transparent);
          animation: pulseLine 3s ease-in-out infinite;
          filter: blur(2px);
        }

        @keyframes pulseLine {
          0%, 100% { transform: translateY(0); opacity: 0.8; }
          50% { transform: translateY(calc(100vh - 200px)); opacity: 0; }
        }

        /* Event Container */
        .event-container {
          position: relative;
          margin-bottom: 32px;
          animation: fadeSlideIn 0.5s ease-out both;
        }

        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .timeline-dot {
          position: absolute;
          left: -41px;
          top: 20px;
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .dot-core {
          width: 10px;
          height: 10px;
          background: #06b6d4;
          border-radius: 50%;
          box-shadow: 0 0 15px #06b6d4, inset 0 0 5px #fff;
          position: relative;
          z-index: 2;
          animation: dotPulse 2s ease-in-out infinite;
        }

        @keyframes dotPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }

        .dot-pulse {
          position: absolute;
          inset: -4px;
          border: 2px solid #06b6d4;
          border-radius: 50%;
          animation: dotExpand 2s ease-out infinite;
        }

        @keyframes dotExpand {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }

        /* Event Card - PART 1 */
        .event-card {
          background: linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(10, 10, 10, 0.95) 100%);
          border: 2px solid rgba(6, 182, 212, 0.3);
          border-radius: 16px;
          padding: 24px;
          position: relative;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(10px);
        }

        .event-card:hover {
          border-color: #06b6d4;
          transform: translateY(-4px) translateX(4px);
          box-shadow: 
            0 12px 40px rgba(6, 182, 212, 0.2),
            0 0 0 1px rgba(6, 182, 212, 0.5);
        }

        .card-scan {
          position: absolute;
          top: -100%;
          left: 0;
          right: 0;
          height: 100%;
          background: linear-gradient(180deg, transparent, rgba(6, 182, 212, 0.1), transparent);
        }

        .event-card:hover .card-scan {
          animation: cardScan 2s ease-in-out;
        }

        @keyframes cardScan {
          to { top: 100%; }
        }

        .card-glow {
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(6, 182, 212, 0.08) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.4s;
        }

        .event-card:hover .card-glow {
          opacity: 1;
          animation: rotate 8s linear infinite;
        }

        @keyframes rotate {
          to { transform: rotate(360deg); }
        }

        /* Event Header */
        .event-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
          position: relative;
          z-index: 2;
        }

        .event-title-section {
          flex: 1;
        }

        .event-title {
          font-size: 20px;
          font-weight: 700;
          color: #e5e7eb;
          margin: 0 0 8px 0;
          letter-spacing: 1px;
          text-shadow: 0 0 10px rgba(6, 182, 212, 0.3);
        }

        .event-date {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #9ca3af;
          font-weight: 500;
        }

        .date-icon {
          width: 14px;
          height: 14px;
          color: #06b6d4;
        }

        .event-amount {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 24px;
          font-weight: 700;
          padding: 8px 16px;
          border-radius: 8px;
          position: relative;
          overflow: hidden;
        }

        .event-amount.positive {
          color: #22c55e;
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.05) 100%);
          border: 2px solid rgba(34, 197, 94, 0.4);
          box-shadow: 0 0 20px rgba(34, 197, 94, 0.2);
        }

        .event-amount.negative {
          color: #ef4444;
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%);
          border: 2px solid rgba(239, 68, 68, 0.4);
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.2);
        }

        .amount-icon {
          width: 20px;
          height: 20px;
          filter: drop-shadow(0 0 6px currentColor);
        }

        .amount-value {
          text-shadow: 0 0 15px currentColor;
          animation: amountPulse 2s ease-in-out infinite;
        }

        @keyframes amountPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }

        .amount-shimmer {
          position: absolute;
          bottom: 0;
          left: -100%;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, transparent, currentColor, transparent);
          animation: shimmerFlow 3s linear infinite;
        }

        @keyframes shimmerFlow {
          to { left: 100%; }
        }

        /* Description */
        .event-description {
          font-size: 14px;
          color: #9ca3af;
          line-height: 1.6;
          margin: 0 0 16px 0;
          position: relative;
          z-index: 2;
          padding-left: 12px;
          border-left: 2px solid rgba(6, 182, 212, 0.2);
        }

        /* Meta Info */
        .event-meta {
          display: flex;
          gap: 24px;
          margin-bottom: 20px;
          flex-wrap: wrap;
          position: relative;
          z-index: 2;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #9ca3af;
          padding: 6px 12px;
          background: rgba(6, 182, 212, 0.05);
          border: 1px solid rgba(6, 182, 212, 0.2);
          border-radius: 6px;
          transition: all 0.3s;
        }

        .meta-item:hover {
          background: rgba(6, 182, 212, 0.1);
          border-color: rgba(6, 182, 212, 0.4);
          transform: translateY(-1px);
        }

        .meta-icon {
          width: 14px;
          height: 14px;
          color: #06b6d4;
        }

        /* Tags Section */
        .tags-section {
          position: relative;
          z-index: 2;
        }

        .tags-view-mode,
        .tags-edit-mode {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }

        .view-tag {
          padding: 8px 14px;
          border: 2px solid;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          display: flex;
          align-items: center;
          gap: 6px;
          position: relative;
          overflow: hidden;
          transition: all 0.3s;
        }

        .view-tag:hover {
          transform: scale(1.05);
          box-shadow: 0 0 15px currentColor;
        }

        .tag-pulse {
          position: absolute;
          inset: -2px;
          opacity: 0;
          border-radius: 8px;
          filter: blur(8px);
          animation: tagPulse 2s ease-in-out infinite;
        }

        @keyframes tagPulse {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.3; }
        }

        .edit-tag {
          padding: 8px 14px;
          border: 2px solid;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.3s;
          background: transparent;
        }

        .edit-tag:hover {
          transform: scale(1.08);
        }

        .edit-tag.selected {
          box-shadow: 0 0 15px currentColor;
        }

        .edit-btn {
          padding: 8px 14px;
          background: transparent;
          border: 2px solid rgba(6, 182, 212, 0.4);
          border-radius: 8px;
          color: #06b6d4;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          position: relative;
          overflow: hidden;
          transition: all 0.3s;
        }

        .edit-btn:hover {
          border-color: #06b6d4;
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(6, 182, 212, 0.3);
        }

        .btn-hover {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, transparent 100%);
          opacity: 0;
          transition: opacity 0.3s;
        }

        .edit-btn:hover .btn-hover {
          opacity: 1;
        }

        .btn-icon {
          width: 14px;
          height: 14px;
        }

        .action-btn {
          width: 40px;
          height: 40px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
          position: relative;
          overflow: hidden;
        }

        .action-btn.save {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          color: white;
          box-shadow: 0 0 15px rgba(34, 197, 94, 0.4);
        }

        .action-btn.save:hover {
          transform: scale(1.1);
          box-shadow: 0 0 25px rgba(34, 197, 94, 0.6);
        }

        .action-btn.cancel {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          box-shadow: 0 0 15px rgba(239, 68, 68, 0.4);
        }

        .action-btn.cancel:hover {
          transform: scale(1.1);
          box-shadow: 0 0 25px rgba(239, 68, 68, 0.6);
        }

        /* Empty State */
        .empty-state {
          padding: 100px 40px;
          text-align: center;
          position: relative;
        }

        .empty-icon-container {
          width: 100px;
          height: 100px;
          margin: 0 auto 32px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .empty-icon {
          width: 56px;
          height: 56px;
          color: #06b6d4;
          opacity: 0.5;
          position: relative;
          z-index: 2;
          animation: iconFloat 3s ease-in-out infinite;
        }

        @keyframes iconFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .pulse-rings {
          position: absolute;
          inset: 0;
        }

        .pulse-ring {
          position: absolute;
          inset: 0;
          border: 2px solid #06b6d4;
          border-radius: 50%;
          animation: ringPulse 2s ease-out infinite;
        }

        .pulse-ring:nth-child(2) {
          animation-delay: 1s;
        }

        @keyframes ringPulse {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          100% {
            transform: scale(1.8);
            opacity: 0;
          }
        }

        .empty-text {
          font-size: 18px;
          color: #9ca3af;
          font-weight: 600;
          margin-bottom: 12px;
          letter-spacing: 1px;
        }

        .empty-subtext {
          font-size: 14px;
          color: #71717a;
          letter-spacing: 0.5px;
        }

        /* Loading State */
        .loading-container {
          min-height: 100vh;
          background: #0a0a0a;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #e5e7eb;
        }

        .hologram-loader {
          width: 140px;
          height: 140px;
          position: relative;
          margin-bottom: 40px;
        }

        .loader-ring {
          position: absolute;
          inset: 0;
          border: 4px solid transparent;
          border-top-color: #06b6d4;
          border-right-color: #06b6d4;
          border-radius: 50%;
          animation: spin 1.5s linear infinite;
        }

        .loader-ring:nth-child(2) {
          border-top-color: #22c55e;
          border-right-color: #22c55e;
          animation-duration: 2s;
          animation-direction: reverse;
        }

        .loader-ring:nth-child(3) {
          border-top-color: #f97316;
          border-right-color: #f97316;
          animation-duration: 2.5s;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .loader-icon {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 48px;
          height: 48px;
          color: #06b6d4;
          animation: pulse 2s ease-in-out infinite;
          filter: drop-shadow(0 0 15px #06b6d4);
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 0.6;
            transform: translate(-50%, -50%) scale(1.15);
          }
        }

        .loading-text {
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 5px;
          margin-bottom: 16px;
          animation: textPulse 1.5s ease-in-out infinite;
        }

        @keyframes textPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .loading-subtext {
          font-size: 13px;
          color: #9ca3af;
          letter-spacing: 3px;
          text-transform: uppercase;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .history-container {
            padding: 20px;
          }

          .content-wrapper {
            padding: 0 10px;
          }

          .title-text {
            font-size: 36px;
          }

          .timeline-container {
            padding-left: 30px;
          }

          .timeline-dot {
            left: -31px;
          }

          .event-card {
            padding: 16px;
          }

          .event-header {
            flex-direction: column;
            gap: 12px;
          }

          .event-amount {
            align-self: flex-start;
          }

          .tag-filters {
            gap: 6px;
          }

          .filter-tag,
          .edit-tag,
          .view-tag {
            font-size: 10px;
            padding: 6px 10px;
          }
        }
      `}</style>
    </div>
  );
}