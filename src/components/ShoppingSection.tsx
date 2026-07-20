/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShoppingBag, Plus, Edit2, Trash2, Check, X, 
  ChevronLeft, ArrowUpRight, DollarSign, Info, ShoppingCart, AlertCircle, Sparkles, CheckSquare, Square
} from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { ShoppingListEntity, ShoppingItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface ShoppingSectionProps {
  shoppingLists: ShoppingListEntity[];
  onUpdateShoppingLists: (lists: ShoppingListEntity[]) => void;
  onAddExpense: (amount: number, category: 'Abastecimento' | 'Alimentação' | 'Manutenção' | 'Outros', description: string) => void;
  onBack: () => void;
}

export const ShoppingSection: React.FC<ShoppingSectionProps> = ({
  shoppingLists,
  onUpdateShoppingLists,
  onAddExpense,
  onBack,
}) => {
  // Navigation: lists view or detailed list view
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  // Modals state
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [listName, setListName] = useState('');

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  
  // Item form states
  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemPriority, setItemPriority] = useState<'Baixa' | 'Média' | 'Alta'>('Média');

  // Expense registration state
  const [isRegisterExpenseOpen, setIsRegisterExpenseOpen] = useState(false);
  const [expenseValue, setExpenseValue] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');

  // ----------------- LIST HELPERS -----------------
  const getListState = (list: ShoppingListEntity): { text: 'Lista vazia' | 'Em andamento' | 'Parcialmente concluída' | 'Concluída'; colorClass: string } => {
    if (list.items.length === 0) {
      return { text: 'Lista vazia', colorClass: 'bg-slate-500/10 border-slate-500/20 text-slate-400' };
    }
    const purchasedCount = list.items.filter(i => i.purchased).length;
    if (purchasedCount === 0) {
      return { text: 'Em andamento', colorClass: 'bg-blue-500/10 border-blue-500/20 text-blue-400' };
    }
    if (purchasedCount === list.items.length) {
      return { text: 'Concluída', colorClass: 'bg-red-500/10 border-red-500/20 text-red-400' };
    }
    return { text: 'Parcialmente concluída', colorClass: 'bg-amber-500/10 border-amber-500/20 text-amber-400' };
  };

  const calculateEstimatedTotal = (list: ShoppingListEntity): number => {
    return list.items.reduce((sum, item) => {
      const q = item.quantity || 1;
      const p = item.estimatedPrice || 0;
      return sum + (q * p);
    }, 0);
  };

  const calculatePurchasedTotal = (list: ShoppingListEntity): number => {
    return list.items
      .filter(item => item.purchased)
      .reduce((sum, item) => {
        const q = item.quantity || 1;
        const p = item.estimatedPrice || 0;
        return sum + (q * p);
      }, 0);
  };

  const activeList = shoppingLists.find(l => l.id === selectedListId);

  // ----------------- LIST OPERATIONS -----------------
  const handleOpenAddList = () => {
    setEditingListId(null);
    setListName('');
    setIsListModalOpen(true);
  };

  const handleOpenEditList = (list: ShoppingListEntity, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingListId(list.id);
    setListName(list.name);
    setIsListModalOpen(true);
  };

  const handleSaveList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!listName.trim()) return;

    if (editingListId) {
      const updated = shoppingLists.map(l => {
        if (l.id === editingListId) {
          return { ...l, name: listName.trim() };
        }
        return l;
      });
      onUpdateShoppingLists(updated);
    } else {
      const newList: ShoppingListEntity = {
        id: 'list_' + Date.now(),
        name: listName.trim(),
        createdAt: new Date().toISOString(),
        items: [],
      };
      onUpdateShoppingLists([...shoppingLists, newList]);
    }
    setIsListModalOpen(false);
  };

  const handleDeleteList = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Excluir esta lista de compras e todos os seus itens definitivamente?')) {
      const updated = shoppingLists.filter(l => l.id !== id);
      onUpdateShoppingLists(updated);
      if (selectedListId === id) {
        setSelectedListId(null);
      }
    }
  };

  // ----------------- ITEM OPERATIONS -----------------
  const handleOpenAddItem = () => {
    setEditingItemId(null);
    setItemName('');
    setItemQuantity('1');
    setItemPrice('');
    setItemPriority('Média');
    setIsItemModalOpen(true);
  };

  const handleOpenEditItem = (item: ShoppingItem) => {
    setEditingItemId(item.id);
    setItemName(item.name);
    setItemQuantity(item.quantity?.toString() || '');
    setItemPrice(item.estimatedPrice?.toString() || '');
    setItemPriority(item.priority);
    setIsItemModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !selectedListId) return;

    const qty = parseInt(itemQuantity);
    const price = parseFloat(itemPrice.replace(',', '.'));

    const parsedQty = isNaN(qty) || qty <= 0 ? undefined : qty;
    const parsedPrice = isNaN(price) || price < 0 ? undefined : Number(price.toFixed(2));

    const updated = shoppingLists.map(list => {
      if (list.id === selectedListId) {
        let updatedItems = [...list.items];
        if (editingItemId) {
          // Edit item
          updatedItems = updatedItems.map(i => {
            if (i.id === editingItemId) {
              return {
                ...i,
                name: itemName.trim(),
                quantity: parsedQty,
                estimatedPrice: parsedPrice,
                priority: itemPriority,
              };
            }
            return i;
          });
        } else {
          // Add item
          const newItem: ShoppingItem = {
            id: 'item_' + Date.now(),
            name: itemName.trim(),
            quantity: parsedQty,
            estimatedPrice: parsedPrice,
            priority: itemPriority,
            purchased: false,
          };
          updatedItems.push(newItem);
        }
        return { ...list, items: updatedItems };
      }
      return list;
    });

    onUpdateShoppingLists(updated);
    setIsItemModalOpen(false);
  };

  const handleToggleItemPurchased = (itemId: string) => {
    if (!selectedListId) return;
    const updated = shoppingLists.map(list => {
      if (list.id === selectedListId) {
        const updatedItems = list.items.map(item => {
          if (item.id === itemId) {
            return { ...item, purchased: !item.purchased };
          }
          return item;
        });
        return { ...list, items: updatedItems };
      }
      return list;
    });
    onUpdateShoppingLists(updated);
  };

  const handleDeleteItem = (itemId: string) => {
    if (!selectedListId) return;
    if (window.confirm('Excluir este item da lista?')) {
      const updated = shoppingLists.map(list => {
        if (list.id === selectedListId) {
          const filteredItems = list.items.filter(item => item.id !== itemId);
          return { ...list, items: filteredItems };
        }
        return list;
      });
      onUpdateShoppingLists(updated);
    }
  };

  // ----------------- REGISTER EXPENSE OPERATION -----------------
  const handleOpenRegisterExpense = () => {
    if (!activeList) return;
    // Pre-fill with purchased items total, or estimated total if none checked
    const purchasedTotal = calculatePurchasedTotal(activeList);
    const estimatedTotal = calculateEstimatedTotal(activeList);
    const defaultValue = purchasedTotal > 0 ? purchasedTotal : estimatedTotal;

    setExpenseValue(defaultValue.toFixed(2));
    setExpenseDesc(`Compra da Casa: ${activeList.name}`);
    setIsRegisterExpenseOpen(true);
  };

  const handleSaveRegisterExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const finalVal = parseFloat(expenseValue.replace(',', '.'));
    if (isNaN(finalVal) || finalVal <= 0) {
      alert('Por favor, informe um valor final válido.');
      return;
    }

    const desc = expenseDesc.trim() || `Compra da Casa: ${activeList?.name || 'Lista'}`;

    // Add standard Quick Expense under category 'Outros'
    onAddExpense(Number(finalVal.toFixed(2)), 'Outros', desc);

    // Show feedback and close
    alert(`Gasto de R$ ${finalVal.toFixed(2).replace('.', ',')} lançado no Financeiro!`);
    setIsRegisterExpenseOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* ----------------- SUB-VIEW: LIST DETAILS ----------------- */}
      {selectedListId && activeList ? (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedListId(null)}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase tracking-widest text-red-500 font-bold font-mono">
                DETALHES DA LISTA
              </span>
              <h2 className="text-base font-black text-white truncate">{activeList.name}</h2>
            </div>
          </div>

          {/* List Status Summary Card */}
          <Card variant="outline" className="p-4 bg-slate-900/10 border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-mono">ESTADO DA LISTA</span>
                <span className={`text-[10px] uppercase font-mono font-bold mt-1 px-2 py-0.5 rounded border inline-block ${getListState(activeList).colorClass}`}>
                  {getListState(activeList).text}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-500 font-mono block">VALOR ESTIMADO TOTAL</span>
                <span className="text-base font-black text-red-400 font-mono">
                  R$ {calculateEstimatedTotal(activeList).toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            {activeList.items.length > 0 && (
              <div className="pt-3 border-t border-slate-900/80 flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>
                  Comprados:{' '}
                  <strong className="text-white">
                    {activeList.items.filter(i => i.purchased).length} / {activeList.items.length}
                  </strong>
                </span>
                <span>
                  Valor dos Comprados:{' '}
                  <strong className="text-white">
                    R$ {calculatePurchasedTotal(activeList).toFixed(2).replace('.', ',')}
                  </strong>
                </span>
              </div>
            )}

            {/* List Actions */}
            <div className="flex gap-2 pt-2 justify-end">
              {activeList.items.length > 0 && (
                <button
                  onClick={handleOpenRegisterExpense}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wide flex items-center gap-1 active:scale-95 transition-transform"
                >
                  <DollarSign className="w-3.5 h-3.5" /> Registrar Gasto da Casa
                </button>
              )}
              <Button variant="danger" size="sm" onClick={handleOpenAddItem} className="text-xs py-1.5 px-3">
                <Plus className="w-3.5 h-3.5" /> Adicionar Item
              </Button>
            </div>
          </Card>

          {/* List of Items */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-wider font-mono">ITENS DA LISTA</h3>
            
            {activeList.items.length === 0 ? (
              <Card variant="outline" className="p-8 text-center border-dashed border-slate-800">
                <ShoppingCart className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-400">Esta lista está vazia</p>
                <p className="text-[10px] text-slate-500 mt-1">Toque no botão acima para adicionar produtos, ferramentas ou itens de supermercado.</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {activeList.items.map(item => {
                  const itemTotal = (item.quantity || 1) * (item.estimatedPrice || 0);
                  
                  return (
                    <Card 
                      key={item.id} 
                      variant="outline" 
                      className={`p-3 border-slate-850/80 flex items-center justify-between gap-3 transition-colors duration-200 ${
                        item.purchased ? 'bg-slate-900/5 opacity-60' : 'bg-slate-950'
                      }`}
                    >
                      {/* Checkbox and item info */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <button
                          onClick={() => handleToggleItemPurchased(item.id)}
                          className={`p-1 rounded-md border shrink-0 transition-colors ${
                            item.purchased 
                              ? 'bg-red-500/10 border-red-500 text-red-400' 
                              : 'border-slate-800 text-slate-600 hover:border-slate-700'
                          }`}
                        >
                          {item.purchased ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        </button>

                        <div className="min-w-0">
                          <span className={`text-xs font-bold block truncate ${item.purchased ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                            {item.name}
                          </span>
                          
                          {/* Item meta labels */}
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-[9px] font-mono text-slate-500">
                            {item.quantity && <span>Qtd: {item.quantity}</span>}
                            {item.estimatedPrice && (
                              <span>R$ {item.estimatedPrice.toFixed(2).replace('.', ',')} /un</span>
                            )}
                            <span className={`px-1 rounded-sm border ${
                              item.priority === 'Alta' 
                                ? 'bg-rose-500/5 border-rose-500/20 text-rose-400' 
                                : item.priority === 'Baixa'
                                  ? 'bg-slate-900 border-slate-800 text-slate-500'
                                  : 'bg-amber-500/5 border-amber-500/20 text-amber-400'
                            }`}>
                              {item.priority}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Item Actions */}
                      <div className="flex items-center gap-2">
                        {item.estimatedPrice && (
                          <span className={`text-xs font-mono font-bold whitespace-nowrap shrink-0 ${item.purchased ? 'text-slate-500' : 'text-slate-300'}`}>
                            R$ {itemTotal.toFixed(2).replace('.', ',')}
                          </span>
                        )}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleOpenEditItem(item)}
                            className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-500 hover:text-slate-300"
                            title="Editar item"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-500 hover:text-rose-400"
                            title="Remover item"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ----------------- SUB-VIEW: LIST OF LISTS ----------------- */
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-red-500 font-bold font-mono">
                RECURSO ATIVO
              </span>
              <h2 className="text-base font-black text-white">Listas de Compras</h2>
            </div>
          </div>

          {/* List Overview Controller */}
          <Card variant="outline" className="p-4 bg-slate-900/10 border-slate-800 flex justify-between items-center">
            <div>
              <span className="text-[10px] text-slate-500 font-mono block">LISTAS DE COMPRAS</span>
              <span className="text-xl font-bold font-mono text-slate-200 mt-0.5 block">{shoppingLists.length}</span>
            </div>
            <Button variant="danger" size="sm" onClick={handleOpenAddList} className="text-xs py-2 px-3 shrink-0">
              <Plus className="w-3.5 h-3.5" /> Criar Lista
            </Button>
          </Card>

          {/* List cards */}
          {shoppingLists.length === 0 ? (
            <Card variant="outline" className="p-8 text-center border-dashed border-slate-800">
              <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-400">Nenhuma lista de compras criada</p>
              <p className="text-[10px] text-slate-500 mt-1 max-w-xs mx-auto">
                Crie listas para supermercado da casa, materiais de limpeza, ferramentas de moto ou itens pessoais.
              </p>
              <button
                onClick={handleOpenAddList}
                className="text-xs font-mono font-bold text-red-400 underline mt-3 hover:text-red-300"
              >
                Criar primeira lista
              </button>
            </Card>
          ) : (
            <div className="space-y-3">
              {shoppingLists.map(list => {
                const listState = getListState(list);
                const listTotal = calculateEstimatedTotal(list);

                return (
                  <Card
                    key={list.id}
                    variant="outline"
                    onClick={() => setSelectedListId(list.id)}
                    className="p-4 bg-slate-900/10 border-slate-800 hover:border-slate-700 cursor-pointer transition-all hover:scale-[1.01] flex flex-col gap-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-bold text-slate-200">{list.name}</h3>
                        <span className="text-[9px] text-slate-500 font-mono block mt-1">
                          Criada em: {new Date(list.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <span className={`text-[8px] uppercase tracking-wide font-mono font-bold px-2 py-0.5 rounded border ${listState.colorClass}`}>
                        {listState.text}
                      </span>
                    </div>

                    <div className="flex justify-between items-center border-t border-slate-900 pt-3">
                      <div className="text-[10px] text-slate-400 font-mono">
                        Itens:{' '}
                        <strong className="text-white">
                          {list.items.filter(i => i.purchased).length} / {list.items.length}
                        </strong>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-slate-300">
                          Total: R$ {listTotal.toFixed(2).replace('.', ',')}
                        </span>
                        
                        {/* List quick actions */}
                        <div className="flex items-center gap-1 border-l border-slate-800/80 pl-2">
                          <button
                            onClick={(e) => handleOpenEditList(list, e)}
                            className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                            title="Editar título"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteList(list.id, e)}
                            className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-500 hover:text-rose-400"
                            title="Excluir lista"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================== SHOPPING LIST MODAL (ADD / EDIT) ==================== */}
      <AnimatePresence>
        {isListModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-xs">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full max-w-md bg-slate-950 rounded-t-3xl border-t border-slate-800 p-6 space-y-4 pb-safe-bottom"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                <h3 className="text-base font-black text-white">
                  {editingListId ? 'Editar Nome da Lista' : 'Criar Lista de Compras'}
                </h3>
                <button
                  onClick={() => setIsListModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveList} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 font-mono">
                    NOME DA LISTA
                  </label>
                  <input
                    type="text"
                    value={listName}
                    onChange={(e) => setListName(e.target.value)}
                    placeholder="Ex: Supermercado do Mês ou Peças Moto"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none"
                    required
                    autoFocus
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {['Supermercado da Semana', 'Peças e Ferramentas', 'Produtos de Limpeza', 'EPIs e Acessórios'].map(ex => (
                      <button
                        type="button"
                        key={ex}
                        onClick={() => setListName(ex)}
                        className="text-[9px] font-mono font-bold bg-slate-900 hover:bg-slate-800 border border-slate-800 px-2 py-1 rounded-md text-slate-400"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>

                <Button variant="danger" size="lg" fullWidth type="submit" className="py-3 font-black tracking-wide mt-2">
                  <Check className="w-5 h-5" />
                  {editingListId ? 'Salvar Alterações' : 'Criar Lista'}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== SHOPPING ITEM MODAL (ADD / EDIT) ==================== */}
      <AnimatePresence>
        {isItemModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-xs">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full max-w-md bg-slate-950 rounded-t-3xl border-t border-slate-800 p-6 space-y-4 pb-safe-bottom"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                <h3 className="text-base font-black text-white">
                  {editingItemId ? 'Editar Item' : 'Adicionar Item à Lista'}
                </h3>
                <button
                  onClick={() => setIsItemModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveItem} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 font-mono">
                    NOME DO ITEM *
                  </label>
                  <input
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="Ex: Capa de chuva, Amaciante, Óleo"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none"
                    required
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                      QUANTIDADE (OPCIONAL)
                    </label>
                    <input
                      type="number"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(e.target.value)}
                      placeholder="Ex: 1"
                      min="1"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                      PREÇO ESTIMADO (R$, OPCIONAL)
                    </label>
                    <input
                      type="text"
                      value={itemPrice}
                      onChange={(e) => setItemPrice(e.target.value)}
                      placeholder="Ex: 12,50"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 font-mono">
                    PRIORIDADE DO ITEM
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Baixa', 'Média', 'Alta'] as const).map((pri) => (
                      <button
                        type="button"
                        key={pri}
                        onClick={() => setItemPriority(pri)}
                        className={`py-2 px-1 text-center text-xs font-bold uppercase rounded-lg border transition-colors ${
                          itemPriority === pri 
                            ? 'bg-rose-500/10 border-rose-500 text-rose-400' 
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {pri}
                      </button>
                    ))}
                  </div>
                </div>

                <Button variant="danger" size="lg" fullWidth type="submit" className="py-3 font-black tracking-wide mt-2">
                  <Check className="w-5 h-5" />
                  {editingItemId ? 'Salvar Item' : 'Adicionar Item'}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== REGISTER AS HOUSE EXPENSE MODAL ==================== */}
      <AnimatePresence>
        {isRegisterExpenseOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-xs">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full max-w-md bg-slate-950 rounded-t-3xl border-t border-slate-800 p-6 space-y-4 pb-safe-bottom"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                <div>
                  <h3 className="text-base font-black text-white">Lançar como Gasto da Casa</h3>
                  <p className="text-xs text-slate-400">Registrar esta compra de forma consolidada no Financeiro</p>
                </div>
                <button
                  onClick={() => setIsRegisterExpenseOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveRegisterExpense} className="space-y-4">
                <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800/60 text-xs text-slate-400 leading-normal flex gap-2">
                  <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    Essa ação vai registrar o valor final abaixo na categoria <strong>Outros</strong> no seu controle financeiro diário, permitindo calcular seu saldo real de caixa.
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                    VALOR REAL DA COMPRA (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-sans font-bold text-slate-500">R$</span>
                    <input
                      type="text"
                      value={expenseValue}
                      onChange={(e) => setExpenseValue(e.target.value)}
                      placeholder="0,00"
                      className="w-full bg-slate-950 border-2 border-slate-800 focus:border-amber-500/50 rounded-2xl pl-11 pr-4 py-3 text-base text-slate-100 font-mono focus:outline-none transition-colors"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 font-mono">
                    DESCRIÇÃO DA DESPESA
                  </label>
                  <input
                    type="text"
                    value={expenseDesc}
                    onChange={(e) => setExpenseDesc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/50 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none"
                    required
                  />
                </div>

                <Button variant="danger" size="lg" fullWidth type="submit" className="py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black tracking-wide mt-2 border-none">
                  <Check className="w-5 h-5" />
                  Confirmar e Registrar Gasto
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
