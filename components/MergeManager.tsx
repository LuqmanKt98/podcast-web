'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Episode } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { clearCache } from '@/lib/data';

interface MergeManagerProps {
    episodes: Episode[];
    onMergeComplete: () => void;
    onClose: () => void;
}

type TabType = 'series' | 'hosts' | 'guests';

interface MergeItem {
    name: string;
    count: number;
    selected: boolean;
}

export default function MergeManager({ episodes, onMergeComplete, onClose }: MergeManagerProps) {
    const [activeTab, setActiveTab] = useState<TabType>('series');
    const [items, setItems] = useState<MergeItem[]>([]);
    const [newName, setNewName] = useState('');
    const [isMerging, setIsMerging] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Extract unique values with counts based on active tab
    const extractedItems = useMemo(() => {
        const countMap = new Map<string, number>();

        episodes.forEach((episode) => {
            if (activeTab === 'series') {
                const series = episode.series || 'Unknown';
                countMap.set(series, (countMap.get(series) || 0) + 1);
            } else if (activeTab === 'hosts') {
                (episode.hosts || []).forEach((host) => {
                    const trimmed = host.trim();
                    if (trimmed) {
                        countMap.set(trimmed, (countMap.get(trimmed) || 0) + 1);
                    }
                });
            } else if (activeTab === 'guests') {
                (episode.guests || []).forEach((guest) => {
                    const trimmed = guest.trim();
                    if (trimmed) {
                        countMap.set(trimmed, (countMap.get(trimmed) || 0) + 1);
                    }
                });
            }
        });

        return Array.from(countMap.entries())
            .map(([name, count]) => ({ name, count, selected: false }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [episodes, activeTab]);

    // Update items when tab changes
    useEffect(() => {
        setItems(extractedItems);
        setNewName('');
        setSearchQuery('');
    }, [extractedItems]);

    // Filter items based on search
    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return items;
        return items.filter((item) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [items, searchQuery]);

    // Get selected items
    const selectedItems = items.filter((item) => item.selected);

    // Toggle selection
    const toggleSelection = (name: string) => {
        setItems((prev) =>
            prev.map((item) =>
                item.name === name ? { ...item, selected: !item.selected } : item
            )
        );
    };

    // Select all filtered items
    const selectAll = () => {
        const filteredNames = new Set(filteredItems.map((i) => i.name));
        setItems((prev) =>
            prev.map((item) =>
                filteredNames.has(item.name) ? { ...item, selected: true } : item
            )
        );
    };

    // Deselect all
    const deselectAll = () => {
        setItems((prev) => prev.map((item) => ({ ...item, selected: false })));
    };

    // Set new name from selected item
    const useAsNewName = (name: string) => {
        setNewName(name);
    };

    // Perform the merge operation
    const performMerge = async () => {
        if (selectedItems.length < 2) {
            toast.error('Select at least 2 items to merge');
            return;
        }

        if (!newName.trim()) {
            toast.error('Enter the new name for merged items');
            return;
        }

        const oldNames = selectedItems.map((i) => i.name);
        const trimmedNewName = newName.trim();

        // Don't proceed if the new name is the only selected one and nothing changes
        if (oldNames.length === 1 && oldNames[0] === trimmedNewName) {
            toast.error('Nothing to merge');
            return;
        }

        setIsMerging(true);

        try {
            // Get all episodes from Firestore
            const episodesRef = collection(db, 'episodes');
            const snapshot = await getDocs(episodesRef);

            let updatedCount = 0;

            // Process each episode
            for (const docSnap of snapshot.docs) {
                const data = docSnap.data();
                let needsUpdate = false;
                const updates: Partial<Episode> = {};

                if (activeTab === 'series') {
                    if (oldNames.includes(data.series)) {
                        updates.series = trimmedNewName;
                        needsUpdate = true;
                    }
                } else if (activeTab === 'hosts') {
                    const hosts = data.hosts || [];
                    const newHosts = hosts.map((h: string) =>
                        oldNames.includes(h.trim()) ? trimmedNewName : h
                    );
                    // Remove duplicates after merge
                    const uniqueHosts = [...new Set(newHosts)];
                    if (JSON.stringify(hosts) !== JSON.stringify(uniqueHosts)) {
                        updates.hosts = uniqueHosts;
                        needsUpdate = true;
                    }
                } else if (activeTab === 'guests') {
                    const guests = data.guests || [];
                    const newGuests = guests.map((g: string) =>
                        oldNames.includes(g.trim()) ? trimmedNewName : g
                    );
                    // Remove duplicates after merge
                    const uniqueGuests = [...new Set(newGuests)];
                    if (JSON.stringify(guests) !== JSON.stringify(uniqueGuests)) {
                        updates.guests = uniqueGuests;
                        needsUpdate = true;
                    }
                }

                if (needsUpdate) {
                    await updateDoc(doc(db, 'episodes', docSnap.id), updates);
                    updatedCount++;
                }
            }

            // Clear cache and notify
            clearCache();
            toast.success(`Merged ${oldNames.length} items into "${trimmedNewName}" (${updatedCount} episodes updated)`);

            // Reset selection and refresh
            setItems((prev) => prev.map((item) => ({ ...item, selected: false })));
            setNewName('');
            onMergeComplete();
        } catch (error) {
            console.error('Merge error:', error);
            toast.error(`Failed to merge: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsMerging(false);
        }
    };

    // Rename a single item
    const renameSingle = async (oldName: string, newNameInput: string) => {
        if (!newNameInput.trim()) {
            toast.error('Enter a new name');
            return;
        }

        const trimmedNewName = newNameInput.trim();
        if (oldName === trimmedNewName) {
            toast.error('Names are the same');
            return;
        }

        setIsMerging(true);

        try {
            const episodesRef = collection(db, 'episodes');
            const snapshot = await getDocs(episodesRef);

            let updatedCount = 0;

            for (const docSnap of snapshot.docs) {
                const data = docSnap.data();
                let needsUpdate = false;
                const updates: Partial<Episode> = {};

                if (activeTab === 'series') {
                    if (data.series === oldName) {
                        updates.series = trimmedNewName;
                        needsUpdate = true;
                    }
                } else if (activeTab === 'hosts') {
                    const hosts = data.hosts || [];
                    if (hosts.includes(oldName)) {
                        updates.hosts = hosts.map((h: string) => (h === oldName ? trimmedNewName : h));
                        needsUpdate = true;
                    }
                } else if (activeTab === 'guests') {
                    const guests = data.guests || [];
                    if (guests.includes(oldName)) {
                        updates.guests = guests.map((g: string) => (g === oldName ? trimmedNewName : g));
                        needsUpdate = true;
                    }
                }

                if (needsUpdate) {
                    await updateDoc(doc(db, 'episodes', docSnap.id), updates);
                    updatedCount++;
                }
            }

            clearCache();
            toast.success(`Renamed "${oldName}" to "${trimmedNewName}" (${updatedCount} episodes updated)`);
            onMergeComplete();
        } catch (error) {
            console.error('Rename error:', error);
            toast.error(`Failed to rename: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsMerging(false);
        }
    };

    const tabConfig = {
        series: { label: 'Series', icon: '📚', color: 'blue' },
        hosts: { label: 'Hosts', icon: '🎙️', color: 'purple' },
        guests: { label: 'Guests', icon: '👥', color: 'green' },
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <div>
                        <h2 className="text-2xl font-bold gradient-text">Merge Manager</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Edit, rename, or merge duplicate entries across all episodes
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 p-4 border-b border-slate-200 bg-slate-50">
                    {(Object.keys(tabConfig) as TabType[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all ${activeTab === tab
                                    ? 'gradient-primary text-white shadow-lg'
                                    : 'bg-white border border-slate-200 text-slate-700 hover:border-blue-300'
                                }`}
                        >
                            <span>{tabConfig[tab].icon}</span>
                            <span>{tabConfig[tab].label}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab ? 'bg-white/20' : 'bg-slate-100'
                                }`}>
                                {extractedItems.length}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Search and Actions */}
                <div className="p-4 border-b border-slate-200 flex flex-wrap gap-3 items-center">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder={`Search ${tabConfig[activeTab].label.toLowerCase()}...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <button
                        onClick={selectAll}
                        className="px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                        Select All
                    </button>
                    <button
                        onClick={deselectAll}
                        className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        Clear Selection
                    </button>
                </div>

                {/* Selected Items Summary */}
                {selectedItems.length > 0 && (
                    <div className="p-4 bg-blue-50 border-b border-blue-100">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="font-semibold text-blue-800">
                                {selectedItems.length} selected:
                            </span>
                            <div className="flex flex-wrap gap-2 flex-1">
                                {selectedItems.slice(0, 5).map((item) => (
                                    <span
                                        key={item.name}
                                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-1"
                                    >
                                        {item.name}
                                        <button
                                            onClick={() => toggleSelection(item.name)}
                                            className="hover:bg-blue-200 rounded-full p-0.5"
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </span>
                                ))}
                                {selectedItems.length > 5 && (
                                    <span className="text-sm text-blue-600">
                                        +{selectedItems.length - 5} more
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                            <span className="text-sm text-blue-700">Merge into:</span>
                            <input
                                type="text"
                                placeholder="Enter new name..."
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="flex-1 min-w-[200px] px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            />
                            <button
                                onClick={performMerge}
                                disabled={isMerging || selectedItems.length < 2 || !newName.trim()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isMerging ? (
                                    <>
                                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Merging...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                        </svg>
                                        Merge Selected
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-2">
                        {filteredItems.map((item) => (
                            <MergeItemRow
                                key={item.name}
                                item={item}
                                onToggle={() => toggleSelection(item.name)}
                                onUseAsName={() => useAsNewName(item.name)}
                                onRename={(newName) => renameSingle(item.name, newName)}
                                isDisabled={isMerging}
                                tabType={activeTab}
                            />
                        ))}
                        {filteredItems.length === 0 && (
                            <div className="text-center py-12 text-slate-500">
                                {searchQuery ? 'No items match your search' : 'No items found'}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                        {filteredItems.length} {tabConfig[activeTab].label.toLowerCase()} found
                        {searchQuery && ` (filtered from ${items.length})`}
                    </p>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// Individual item row component
interface MergeItemRowProps {
    item: MergeItem;
    onToggle: () => void;
    onUseAsName: () => void;
    onRename: (newName: string) => void;
    isDisabled: boolean;
    tabType: TabType;
}

function MergeItemRow({ item, onToggle, onUseAsName, onRename, isDisabled, tabType }: MergeItemRowProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(item.name);

    const handleSaveEdit = () => {
        if (editValue.trim() && editValue.trim() !== item.name) {
            onRename(editValue.trim());
        }
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setEditValue(item.name);
        setIsEditing(false);
    };

    return (
        <div
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${item.selected
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
        >
            {/* Checkbox */}
            <button
                onClick={onToggle}
                disabled={isDisabled}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${item.selected
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-slate-300 hover:border-blue-400'
                    }`}
            >
                {item.selected && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                )}
            </button>

            {/* Name */}
            <div className="flex-1 min-w-0">
                {isEditing ? (
                    <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') handleCancelEdit();
                        }}
                        autoFocus
                        className="w-full px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                ) : (
                    <span className="font-medium text-slate-800 truncate block">{item.name}</span>
                )}
            </div>

            {/* Count Badge */}
            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                {item.count} {item.count === 1 ? 'episode' : 'episodes'}
            </span>

            {/* Actions */}
            <div className="flex items-center gap-1">
                {isEditing ? (
                    <>
                        <button
                            onClick={handleSaveEdit}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Save"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </button>
                        <button
                            onClick={handleCancelEdit}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Cancel"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={() => setIsEditing(true)}
                            disabled={isDisabled}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit name"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        <button
                            onClick={onUseAsName}
                            disabled={isDisabled}
                            className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Use as merge target name"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
