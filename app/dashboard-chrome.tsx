'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Anchor, Bell, ChevronRight, Menu, Ship, UserRound } from 'lucide-react';
import type { Access } from './access';

export type NavigationItem = { key: string; label: string; icon: ReactNode; stage?: number };

export function DashboardSidebar({ access, items, unreadCount, active, onNavigate }: {
  access: Access;
  items: NavigationItem[];
  unreadCount: number;
  active: (item: NavigationItem) => boolean;
  onNavigate: (item: NavigationItem) => void;
}) {
  return <aside className="sidebar no-print"><div className="sidebar-symbol" aria-label="Polisi Perairan"><img src="/Lambang_Korpolairud.svg" alt="Lambang Korpolairud" /><strong><span>POLISI</span><span>PERAIRAN</span></strong></div><nav className="nav" aria-label="Navigasi utama">{items.filter((item) => item.key !== 'notifications').map((item) => <button key={`${item.key}-${item.stage ?? ''}`} className={active(item) ? 'active' : ''} onClick={() => onNavigate(item)}>{item.icon}<span>{item.label}</span></button>)}</nav><div className="sidebar-maritime"><Ship size={40} /><strong>Jaga Laut<br />Jaga Masa Depan</strong></div><div className="sidebar-foot"><b>{access.name}</b><br />{access.organization}<br /><a href="/api/auth/logout" target="_top">Keluar akun</a></div></aside>;
}

export function DashboardHeader({ access, unreadCount, onNotifications, onProfileEdit, onMenu }: {
  access: Access;
  unreadCount: number;
  onNotifications: () => void;
  onProfileEdit: () => void;
  onMenu: () => void;
}) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string; category: string; location: string; stage: number; updated_at: string }[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!notificationsOpen) return;
    void fetch('/api/incidents', { cache: 'no-store' }).then(async (response) => response.ok ? await response.json() : []).then((items) => setNotifications(Array.isArray(items) ? items.sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at))).slice(0, 5) : [])).catch(() => setNotifications([]));
  }, [notificationsOpen]);
  useEffect(() => {
    if (!notificationsOpen && !profileOpen) return;
    const closeMenus = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) { setNotificationsOpen(false); setProfileOpen(false); }
    };
    document.addEventListener('pointerdown', closeMenus);
    return () => document.removeEventListener('pointerdown', closeMenus);
  }, [notificationsOpen, profileOpen]);
  const showNotifications = () => { setNotificationsOpen((open) => !open); setProfileOpen(false); };
  const showProfile = () => { setProfileOpen((open) => !open); setNotificationsOpen(false); };
  return <header className="topbar no-print"><div className="mobile-topbrand"><span className="mobile-brandmark"><Anchor size={22} /></span><div><b>SIRATSI <em className="brand-expansion">(Strategi - Sistem - Instrumen - Hasil)</em></b><small>Keamanan Laut Lampung</small></div></div><div className="desktop-topbrand"><strong>SIRATSI <em className="brand-expansion">(Strategi - Sistem - Instrumen - Hasil)</em></strong><span>Sistem Kolaborasi Keamanan Laut · Ditpolairud Polda Lampung</span></div><div className="topbar-motto">LAUT AMAN · EKONOMI LANCAR<br />NEGERI SEJAHTERA</div><div ref={menuRef} className="topbar-actions"><div className="topbar-menu"><button type="button" className="topbar-alert" aria-label={`Buka notifikasi: ${unreadCount} belum dibaca`} aria-expanded={notificationsOpen} onClick={showNotifications}><Bell size={21} />{unreadCount > 0 && <span>{unreadCount}</span>}</button>{notificationsOpen && <div className="topbar-dropdown notification-dropdown"><div className="topbar-dropdown-head"><b>Notifikasi</b><small>{unreadCount} belum dibaca</small></div>{notifications.length ? <div className="topbar-notification-list">{notifications.map((item) => <button key={item.id} onClick={() => { setNotificationsOpen(false); onNotifications(); }}><b>{item.category}</b><span>{item.location} · Tahap {item.stage + 1}</span><small>{new Date(item.updated_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</small></button>)}</div> : <p className="topbar-dropdown-empty">Belum ada notifikasi yang dapat ditampilkan.</p>}<button className="topbar-dropdown-link" onClick={() => { setNotificationsOpen(false); onNotifications(); }}>Lihat semua notifikasi <ChevronRight size={15} /></button></div>}</div><div className="topbar-menu"><button type="button" className="profile-trigger" aria-label="Buka menu profil" aria-expanded={profileOpen} onClick={showProfile}><span className="profile-avatar">{access.hasProfilePhoto ? <img src="/api/profile" alt="" /> : <UserRound size={19} />}</span><span className="topbar-user"><b>{access.name}</b><small>{access.jobTitle || access.organization}</small></span></button>{profileOpen && <div className="topbar-dropdown profile-dropdown"><div><b>{access.name}</b><small>{access.jobTitle || access.organization}</small><small>{access.email}</small></div><button className="profile-edit-link" onClick={() => { setProfileOpen(false); onProfileEdit(); }}>Edit profil <ChevronRight size={15} /></button><a href="/api/auth/logout" target="_top">Keluar akun <ChevronRight size={15} /></a></div>}</div><button type="button" className="mobile-menu-trigger" aria-label="Buka semua menu" onClick={() => { setNotificationsOpen(false); setProfileOpen(false); onMenu(); }}><Menu size={22} /></button></div></header>;
}
