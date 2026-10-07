import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { NotificationContext } from '../context/NotificationContext';
import { Plus, Edit2, Trash2, Search, X, Loader, Tag, AlertTriangle, CheckCircle, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { QuantityStepper } from '../components/FormFields';
import { formatPrice } from '../utils/currency';

// en-CA formats as YYYY-MM-DD in the user's local timezone, matching <input type="date"> values
const todayISO = () => new Date().toLocaleDateString('en-CA');

const MAX_SHELF_LIFE = { 'Dry Fish': 90, Eggs: 30, Chicken: 14 };
const DEFAULT_SHELF_LIFE = { 'Dry Fish': '90', Eggs: '21', Chicken: '7' };

const STEP_FIELDS = {
  1: ['name', 'description', 'category'],
  2: ['imageUrl'],
  3: ['basePrice', 'costPrice', 'discount', 'stock'],
  4: ['origin', 'harvestDate', 'shelfLife'],
};

const AdminProducts = () => {
  const { showToast } = useContext(NotificationContext);
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  // Sorting & Pagination States
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Form Modal Step-wizard states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1); // 1: Basic, 2: Images, 3: Pricing/Stock/Variants, 4: Sourcing/Specs
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Archive Soft-Delete confirmation states
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Core Form inputs
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'Dry Fish',
    subcategory: '',
    imageUrl: '',
    basePrice: '',
    costPrice: '',
    discount: '0',
    stock: '0',
    shelfLife: DEFAULT_SHELF_LIFE['Dry Fish'],
    origin: 'Pasture Barn A',
    harvestDate: todayISO()
  });

  // Validation errors state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Dynamic Specs state
  const [specs, setSpecs] = useState([{ key: '', value: '' }]);

  // Dynamic Variants state
  const [variants, setVariants] = useState([{ name: '', price: '', costPrice: '', stock: '' }]);

  // Sourcing dropdown choices
  const registeredSources = [
    'Pasture Barn A',
    'Pasture Barn B',
    'Boat Ocean Breeze',
    'Boat Deep Blue',
    'Grassland Coop #4',
    'Grassland Coop #7',
    'Coastal Sourcing Dock'
  ];

  const fetchProducts = async () => {
    try {
      const { data } = await axios.get('/api/products');
      // Filter out soft-deleted items on client just in case
      const active = data.filter(p => !p.isDeleted);
      setProducts(active);
    } catch (err) {
      showToast('Could not load products database.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      category: 'Dry Fish',
      subcategory: '',
      imageUrl: '',
      basePrice: '',
      costPrice: '',
      discount: '0',
      stock: '0',
      shelfLife: DEFAULT_SHELF_LIFE['Dry Fish'],
      origin: 'Pasture Barn A',
      harvestDate: todayISO()
    });
    setSpecs([{ key: '', value: '' }]);
    setVariants([{ name: '', price: '', costPrice: '', stock: '' }]);
    setEditingId(null);
    setErrors({});
    setTouched({});
    setModalStep(1);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prod) => {
    resetForm();
    setEditingId(prod._id);
    
    const parsedShelfLife = prod.specifications?.['Shelf Life']?.replace(' Days', '') || DEFAULT_SHELF_LIFE[prod.category] || DEFAULT_SHELF_LIFE['Dry Fish'];
    const savedOrigin = prod.specifications?.['Origin Source'];
    const parsedOrigin = registeredSources.includes(savedOrigin) ? savedOrigin : 'Pasture Barn A';
    const parsedHarvestDate = prod.specifications?.['Harvest Date'] || todayISO();

    setForm({
      name: prod.name,
      description: prod.description,
      category: prod.category,
      subcategory: prod.subcategory || '',
      imageUrl: prod.images[0] || '',
      basePrice: prod.basePrice.toString(),
      costPrice: prod.costPrice.toString(),
      discount: (prod.discount || 0).toString(),
      stock: prod.stock.toString(),
      shelfLife: parsedShelfLife,
      origin: parsedOrigin,
      harvestDate: parsedHarvestDate
    });

    if (prod.specifications) {
      const parsedSpecs = Object.entries(prod.specifications)
        .filter(([k]) => !['Shelf Life', 'Origin Source', 'Harvest Date'].includes(k))
        .map(([k, v]) => ({ key: k, value: v }));
      if (parsedSpecs.length > 0) setSpecs(parsedSpecs);
    }

    if (prod.variants && prod.variants.length > 0) {
      const parsedVariants = prod.variants.map(v => ({
        name: v.name,
        price: v.price.toString(),
        costPrice: (v.costPrice || 0).toString(),
        stock: v.stock.toString()
      }));
      setVariants(parsedVariants);
    }

    setModalStep(1);
    setIsModalOpen(true);
  };

  // Soft-Delete modal helpers
  const handleOpenArchiveModal = (prod) => {
    setSelectedProduct(prod);
    setIsDeleteOpen(true);
  };

  const confirmArchiveProduct = async () => {
    if (!selectedProduct) return;
    try {
      await axios.delete(`/api/products/${selectedProduct._id}`);
      showToast(`Product "${selectedProduct.name}" archived successfully.`, 'success');
      setIsDeleteOpen(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (err) {
      showToast('Could not archive product.', 'error');
    }
  };

  // Validation logic
  const validateField = (name, value, currentCategory = form.category) => {
    let err = '';
    switch (name) {
      case 'name':
        if (!value.trim()) err = 'Product name is required';
        else if (value.length < 3 || value.length > 80) err = 'Name must be 3 to 80 characters';
        break;
      case 'category':
        if (!['Dry Fish', 'Eggs', 'Chicken'].includes(value)) err = 'Must choose a valid category';
        break;
      case 'basePrice': {
        const priceVal = Number(value);
        if (!value) err = 'Selling price is required';
        else if (isNaN(priceVal) || priceVal <= 0) err = 'Price must be greater than 0';
        break;
      }
      case 'costPrice': {
        const costVal = Number(value);
        if (!value) err = 'Cost price is required';
        else if (isNaN(costVal) || costVal <= 0) err = 'Cost must be greater than 0';
        break;
      }
      case 'discount': {
        const discountVal = Number(value);
        if (value !== '' && (isNaN(discountVal) || discountVal < 0 || discountVal > 100)) err = 'Discount must be between 0 and 100%';
        break;
      }
      case 'stock': {
        const stockVal = Number(value);
        if (value === '') err = 'Stock is required';
        else if (isNaN(stockVal) || !Number.isInteger(stockVal) || stockVal < 0) err = 'Stock must be a whole number of 0 or more';
        break;
      }
      case 'shelfLife': {
        const life = Number(value);
        const maxLife = MAX_SHELF_LIFE[currentCategory] || 90;
        if (!value) err = 'Shelf life is required';
        else if (isNaN(life) || !Number.isInteger(life) || life < 1) err = 'Shelf life must be a whole number of days';
        else if (life > maxLife) err = `${currentCategory} shelf life cannot exceed ${maxLife} days`;
        break;
      }
      case 'imageUrl':
        if (!value.trim()) err = 'Image link is required';
        break;
      case 'description':
        if (!value.trim()) err = 'Description is required';
        else if (value.length < 20 || value.length > 1000) err = 'Description must be between 20 and 1000 characters';
        break;
      case 'origin':
        if (!registeredSources.includes(value)) err = 'Must select a registered location';
        break;
      case 'harvestDate':
        if (!value) err = 'Harvest date is required';
        else if (value > todayISO()) err = 'Harvest date cannot be in the future';
        break;
      default:
        break;
    }
    return err;
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));

    if (name === 'category') {
      setErrors(prev => ({ ...prev, shelfLife: validateField('shelfLife', form.shelfLife, value) }));
    }

    if (touched[name]) {
      const err = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: err }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const err = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: err }));
  };

  const handleSpecChange = (idx, field, val) => {
    const updated = [...specs];
    updated[idx][field] = val;
    setSpecs(updated);
  };
  const addSpecField = () => setSpecs([...specs, { key: '', value: '' }]);
  const removeSpecField = (idx) => setSpecs(specs.filter((_, i) => i !== idx));

  const handleVariantChange = (idx, field, val) => {
    const updated = [...variants];
    updated[idx] = { ...updated[idx], [field]: val };
    setVariants(updated);
    if (errors.variants) setErrors(prev => ({ ...prev, variants: '' }));
  };
  const addVariantField = () => setVariants([...variants, { name: '', price: '', costPrice: '', stock: '' }]);
  const removeVariantField = (idx) => setVariants(variants.filter((_, i) => i !== idx));

  // Validates the given fields, marks them touched so messages render, and returns the errors found
  const validateFields = (fields) => {
    const fieldErrors = {};
    fields.forEach(f => { fieldErrors[f] = validateField(f, form[f]); });
    setErrors(prev => ({ ...prev, ...fieldErrors }));
    setTouched(prev => ({ ...prev, ...Object.fromEntries(fields.map(f => [f, true])) }));
    return Object.fromEntries(Object.entries(fieldErrors).filter(([, err]) => err));
  };

  const validateVariants = () => {
    const incomplete = variants.find(v => (v.name.trim() || v.price || v.stock) && (!v.name.trim() || !(Number(v.price) > 0)));
    if (incomplete) return 'Each package option needs a name and a price greater than 0';
    const badStock = variants.find(v => v.stock !== '' && (!Number.isInteger(Number(v.stock)) || Number(v.stock) < 0));
    if (badStock) return 'Package option stock must be a whole number of 0 or more';
    return '';
  };

  // Multi-step modal navigation
  const nextStep = () => {
    const stepErrors = validateFields(STEP_FIELDS[modalStep]);
    const variantError = modalStep === 3 ? validateVariants() : '';
    setErrors(prev => ({ ...prev, variants: modalStep === 3 ? variantError : prev.variants }));

    if (Object.keys(stepErrors).length > 0 || variantError) {
      showToast('Please resolve validation warnings in current step.', 'error');
      return;
    }

    setModalStep(prev => prev + 1);
  };

  const prevStep = () => setModalStep(prev => prev - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const allErrors = validateFields(Object.values(STEP_FIELDS).flat());
    const variantError = validateVariants();
    setErrors(prev => ({ ...prev, variants: variantError }));
    if (variantError) allErrors.variants = variantError;

    const firstInvalidStep = Object.keys(STEP_FIELDS)
      .map(Number)
      .find(step => STEP_FIELDS[step].some(f => allErrors[f]) || (step === 3 && allErrors.variants));

    if (firstInvalidStep) {
      setModalStep(firstInvalidStep);
      showToast(`Please fix the highlighted fields in step ${firstInvalidStep}.`, 'error');
      return;
    }

    setSubmitting(true);
    try {
      const formattedSpecs = {
        'Shelf Life': `${form.shelfLife} Days`,
        'Origin Source': form.origin,
        'Harvest Date': form.harvestDate
      };
      
      specs.forEach(s => {
        if (s.key.trim() && s.value.trim()) {
          formattedSpecs[s.key.trim()] = s.value.trim();
        }
      });

      const formattedVariants = variants
        .filter(v => v.name.trim() && v.price)
        .map(v => ({
          name: v.name.trim(),
          price: Number(v.price),
          costPrice: Number(v.costPrice || 0),
          stock: Number(v.stock || 0),
          sku: `RIP-${form.category.substring(0, 3).toUpperCase()}-${v.name.replace(/\s+/g, '-').toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`
        }));

      let totalStock = Number(form.stock);
      if (formattedVariants.length > 0) {
        totalStock = formattedVariants.reduce((sum, v) => sum + v.stock, 0);
      }

      const payload = {
        name: form.name,
        description: form.description,
        category: form.category,
        subcategory: form.subcategory,
        images: [form.imageUrl],
        basePrice: Number(form.basePrice),
        costPrice: Number(form.costPrice),
        discount: Number(form.discount || 0),
        stock: totalStock,
        variants: formattedVariants,
        specifications: formattedSpecs
      };

      if (editingId) {
        await axios.put(`/api/products/${editingId}`, payload);
        showToast('Harvest catalog product updated successfully!', 'success');
      } else {
        await axios.post('/api/products', payload);
        showToast('Product registered in harvest directory!', 'success');
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save harvest product details.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Sorting Handler
  const handleSort = (field) => {
    const isAsc = sortBy === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortBy(field);
  };

  const getInputClass = (fieldName) => {
    const baseClass = "w-full border outline-none rounded py-2 px-3 text-gray-800 input-field text-xs ";
    if (!touched[fieldName]) return baseClass + "border-gray-200 focus:border-[#2F4B3C]";
    return errors[fieldName] ? baseClass + "input-invalid" : baseClass + "input-valid";
  };

  const getCategoryColor = (cat) => {
    if (cat === 'Dry Fish') return 'bg-[#3E6B6B]/10 border border-[#3E6B6B]/20 text-[#3E6B6B]';
    if (cat === 'Eggs') return 'bg-[#C99A3A]/10 border border-[#C99A3A]/20 text-[#C99A3A]';
    return 'bg-[#2F4B3C]/10 border border-[#2F4B3C]/20 text-[#2F4B3C]';
  };

  // Filter, Sort, & Pagination logic
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === '' ? true : p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let valA = a[sortBy];
    let valB = b[sortBy];

    if (sortBy === 'stock' || sortBy === 'basePrice') {
      valA = Number(valA);
      valB = Number(valB);
    } else {
      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginated chunk
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);

  return (
    <div className="space-y-6 text-left font-sans print:hidden">
      
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-serif font-semibold text-[#2F4B3C]">Harvest Catalog Controls</h2>
          <p className="text-[10px] text-gray-400 font-light">Trace catalog listings, adjust pricing, organize variants, and manage crop collections.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-[#2F4B3C] hover:bg-[#A65D3D] text-white font-bold text-[10px] uppercase tracking-widest py-3 px-5 rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm select-none"
        >
          <Plus className="w-4 h-4" /> Add Harvest Product
        </button>
      </div>

      {/* Filters & Search Row */}
      <div className="bg-white border border-gray-150/60 rounded p-4 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center select-none">
        <div className="relative w-full sm:max-w-xs text-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search SKU or name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 focus:border-[#2F4B3C] focus:ring-1 focus:ring-[#2F4B3C] outline-none rounded text-xs"
          />
        </div>

        <div className="flex items-center gap-2 text-xs w-full sm:w-auto">
          <span className="font-bold text-gray-450 shrink-0">Category Filter:</span>
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            className="w-full sm:w-auto bg-white border border-gray-200 outline-none rounded py-1.5 px-3 text-xs text-gray-700 cursor-pointer"
          >
            <option value="">All Categories</option>
            <option value="Dry Fish">Dry Fish</option>
            <option value="Eggs">Eggs</option>
            <option value="Chicken">Chicken</option>
          </select>
        </div>
      </div>

      {/* Main Paginated Table */}
      <div className="bg-white border border-gray-200 rounded overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex justify-center text-gray-400 text-xs"><Loader className="w-5 h-5 animate-spin" /></div>
        ) : currentItems.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-xs">No active harvest products found.</div>
        ) : (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-150/60 text-gray-400 font-bold uppercase tracking-wider text-[9px] bg-gray-50/50 select-none">
                  <th className="p-4">Harvest Image</th>
                  <th className="p-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                    Product Details <ArrowUpDown className="w-3 h-3 inline ml-1 text-gray-450" />
                  </th>
                  <th className="p-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('category')}>
                    Category <ArrowUpDown className="w-3 h-3 inline ml-1 text-gray-450" />
                  </th>
                  <th className="p-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('basePrice')}>
                    Price <ArrowUpDown className="w-3 h-3 inline ml-1 text-gray-450" />
                  </th>
                  <th className="p-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('stock')}>
                    Stock <ArrowUpDown className="w-3 h-3 inline ml-1 text-gray-450" />
                  </th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((prod) => (
                  <tr key={prod._id} className="border-b border-gray-50 hover:bg-[#F6EFE3]/30 transition-colors group">
                    <td className="p-4 shrink-0 select-none">
                      <img
                        src={prod.images[0]}
                        alt={prod.name}
                        className="w-10 h-10 rounded object-cover border border-gray-250/50 bg-gray-50"
                      />
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-gray-900 leading-snug">{prod.name}</div>
                      <div className="text-[9px] text-gray-400 font-mono tracking-wide mt-0.5">{prod.sku}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider select-none ${getCategoryColor(prod.category)}`}>
                        {prod.category}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-gray-800">{formatPrice(prod.basePrice)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase tracking-wider select-none ${
                        prod.stock === 0 ? 'bg-red-50 text-red-700 border border-red-100' :
                        prod.stock < 10 ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        'bg-emerald-50 text-emerald-800 border-emerald-100'
                      }`}>
                        {prod.stock} units
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {/* Row action icons visible on hover or print */}
                      <div className="flex justify-end gap-2.5 opacity-60 group-hover:opacity-100 transition-opacity select-none">
                        <button
                          onClick={() => handleOpenEditModal(prod)}
                          className="text-[#2F4B3C] hover:text-[#A65D3D] p-1 cursor-pointer"
                          title="Edit Details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenArchiveModal(prod)}
                          className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                          title="Archive Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-white border border-gray-150 p-4 rounded shadow-sm text-xs select-none">
          <span className="text-gray-400 font-light">Page {currentPage} of {totalPages} ({filteredProducts.length} items total)</span>
          <div className="flex items-center gap-1.5 font-bold">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-200 hover:bg-gray-50 rounded disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-200 hover:bg-gray-50 rounded disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MULTI-STEP CREATION WIZARD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm select-none">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 border border-gray-150/60 shadow-2xl relative animate-fade-in-up flex flex-col max-h-[90vh]">
            
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
              <h3 className="font-serif text-sm font-bold text-[#2F4B3C]">
                {editingId ? 'Edit Product Directory' : 'Add Sourced Crop Listing'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer font-bold">✕</button>
            </div>

            {/* Wizard Steps indicator bar */}
            <div className="mb-6">
              <div className="flex justify-between text-[8px] uppercase tracking-wider font-black text-gray-400 mb-2">
                <span className={modalStep >= 1 ? 'text-[#2F4B3C]' : ''}>1. Basic Info</span>
                <span className={modalStep >= 2 ? 'text-[#2F4B3C]' : ''}>2. Images</span>
                <span className={modalStep >= 3 ? 'text-[#2F4B3C]' : ''}>3. Pricing & Options</span>
                <span className={modalStep >= 4 ? 'text-[#2F4B3C]' : ''}>4. Sourcing & Specs</span>
              </div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-[#2F4B3C] h-full transition-all duration-350"
                  style={{ width: `${(modalStep / 4) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Wizard Forms */}
            <div className="flex-1 overflow-y-auto pr-1 text-xs text-gray-600 select-text">
              {modalStep === 1 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Product Name</label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleFormChange}
                      onBlur={handleBlur}
                      className={getInputClass('name')}
                    />
                    {touched.name && errors.name && (
                      <span className="text-red-500 font-bold text-[9px] tracking-wide flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="w-3 h-3 shrink-0" /> {errors.name}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Category</label>
                      <select
                        name="category"
                        value={form.category}
                        onChange={handleFormChange}
                        className="w-full border border-gray-200 outline-none rounded py-2 px-3 text-xs bg-white cursor-pointer"
                      >
                        <option value="Dry Fish">Dry Fish</option>
                        <option value="Eggs">Eggs</option>
                        <option value="Chicken">Chicken</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Sub-Category</label>
                      <input
                        type="text"
                        name="subcategory"
                        placeholder="e.g. Free-Range, Solar Dried"
                        value={form.subcategory}
                        onChange={handleFormChange}
                        className="w-full border border-gray-200 outline-none rounded py-2 px-3 text-xs focus:border-[#2F4B3C]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Product Sourcing Description</label>
                    <textarea
                      name="description"
                      rows="4"
                      value={form.description}
                      onChange={handleFormChange}
                      onBlur={handleBlur}
                      className={getInputClass('description')}
                    />
                    {touched.description && errors.description && (
                      <span className="text-red-500 font-bold text-[9px] tracking-wide flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="w-3 h-3 shrink-0" /> {errors.description}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {modalStep === 2 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Cover Image URL</label>
                    <input
                      type="text"
                      name="imageUrl"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={form.imageUrl}
                      onChange={handleFormChange}
                      onBlur={handleBlur}
                      className={getInputClass('imageUrl')}
                    />
                    {touched.imageUrl && errors.imageUrl && (
                      <span className="text-red-500 font-bold text-[9px] tracking-wide flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="w-3 h-3 shrink-0" /> {errors.imageUrl}
                      </span>
                    )}
                  </div>

                  {form.imageUrl && !errors.imageUrl && (
                    <div className="border border-gray-150 p-2.5 rounded text-center bg-gray-50 select-none">
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Image Preview</span>
                      <img 
                        src={form.imageUrl} 
                        alt="Crop Preview" 
                        className="w-40 h-40 rounded object-cover mx-auto border border-gray-200 bg-white"
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=200'; }}
                      />
                    </div>
                  )}
                </div>
              )}

              {modalStep === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Base Price (LKR)</label>
                      <input
                        type="number"
                        name="basePrice"
                        step="0.01"
                        value={form.basePrice}
                        onChange={handleFormChange}
                        onBlur={handleBlur}
                        className={getInputClass('basePrice')}
                      />
                      {touched.basePrice && errors.basePrice && (
                        <span className="text-red-500 font-bold text-[9px] tracking-wide flex items-center gap-1 mt-0.5">
                          <AlertTriangle className="w-3 h-3 shrink-0" /> {errors.basePrice}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Cost Price (LKR)</label>
                      <input
                        type="number"
                        name="costPrice"
                        step="0.01"
                        value={form.costPrice}
                        onChange={handleFormChange}
                        onBlur={handleBlur}
                        className={getInputClass('costPrice')}
                      />
                      {touched.costPrice && errors.costPrice && (
                        <span className="text-red-500 font-bold text-[9px] tracking-wide flex items-center gap-1 mt-0.5">
                          <AlertTriangle className="w-3 h-3 shrink-0" /> {errors.costPrice}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Discount (%)</label>
                      <input
                        type="number"
                        name="discount"
                        min="0"
                        max="100"
                        value={form.discount}
                        onChange={handleFormChange}
                        onBlur={handleBlur}
                        className={getInputClass('discount')}
                      />
                      {touched.discount && errors.discount && (
                        <span className="text-red-500 font-bold text-[9px] tracking-wide flex items-center gap-1 mt-0.5">
                          <AlertTriangle className="w-3 h-3 shrink-0" /> {errors.discount}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Base Stock Count (Units)</label>
                    <div className="flex items-center gap-4">
                      <QuantityStepper
                        value={parseInt(form.stock) || 0}
                        min={0}
                        max={9999}
                        onChange={(newVal) => {
                          setForm(prev => ({ ...prev, stock: String(newVal) }));
                          if (touched.stock) {
                            const err = validateField('stock', String(newVal));
                            setErrors(prev => ({ ...prev, stock: err }));
                          }
                        }}
                      />
                      <span className="text-xs text-gray-500 font-medium">Units in inventory</span>
                    </div>
                    {touched.stock && errors.stock && (
                      <span className="text-red-500 font-bold text-[9px] tracking-wide flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="w-3 h-3 shrink-0" /> {errors.stock}
                      </span>
                    )}
                  </div>

                  {/* Dynamic Variant List builder */}
                  <div className="border-t border-gray-100 pt-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-[10px] font-black text-[#A65D3D] uppercase tracking-wider">Package Weights & Custom Variants</h4>
                      <button
                        type="button"
                        onClick={addVariantField}
                        className="text-[#2F4B3C] hover:text-[#A65D3D] font-bold text-[9px] uppercase tracking-wider cursor-pointer"
                      >
                        + Add Option
                      </button>
                    </div>

                    <div className="space-y-3">
                      {variants.map((v, index) => (
                        <div key={index} className="grid grid-cols-4 gap-2 items-center bg-[#F6EFE3] p-2.5 rounded border border-gray-150/40 relative">
                          <input
                            type="text"
                            placeholder="e.g. 500g Pack"
                            value={v.name}
                            onChange={(e) => handleVariantChange(index, 'name', e.target.value)}
                            className="border border-gray-200 rounded py-1 px-2 w-full text-[10px] bg-white font-semibold"
                          />
                          <input
                            type="number"
                            placeholder="Price (LKR)"
                            value={v.price}
                            onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                            className="border border-gray-200 rounded py-1 px-2 w-full text-[10px] bg-white"
                          />
                          <input
                            type="number"
                            placeholder="Stock"
                            value={v.stock}
                            onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                            className="border border-gray-200 rounded py-1 px-2 w-full text-[10px] bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => removeVariantField(index)}
                            className="text-red-500 hover:text-red-750 font-bold text-[11px] text-right cursor-pointer select-none"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                    {errors.variants && (
                      <span className="text-red-500 font-bold text-[9px] tracking-wide flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="w-3 h-3 shrink-0" /> {errors.variants}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {modalStep === 4 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Registered Origin Source</label>
                      <select
                        name="origin"
                        value={form.origin}
                        onChange={handleFormChange}
                        onBlur={handleBlur}
                        className={getInputClass('origin')}
                      >
                        {registeredSources.map((o, idx) => (
                          <option key={idx} value={o}>{o}</option>
                        ))}
                      </select>
                      {touched.origin && errors.origin && (
                        <span className="text-red-500 font-bold text-[9px] tracking-wide flex items-center gap-1 mt-0.5">
                          <AlertTriangle className="w-3 h-3 shrink-0" /> {errors.origin}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Harvest Date</label>
                      <input
                        type="date"
                        name="harvestDate"
                        value={form.harvestDate}
                        onChange={handleFormChange}
                        onBlur={handleBlur}
                        className={getInputClass('harvestDate')}
                      />
                      {touched.harvestDate && errors.harvestDate && (
                        <span className="text-red-500 font-bold text-[9px] tracking-wide flex items-center gap-1 mt-0.5">
                          <AlertTriangle className="w-3 h-3 shrink-0" /> {errors.harvestDate}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Maximum Shelf Life (Days)</label>
                    <input
                      type="number"
                      name="shelfLife"
                      value={form.shelfLife}
                      onChange={handleFormChange}
                      onBlur={handleBlur}
                      className={getInputClass('shelfLife')}
                    />
                    {touched.shelfLife && errors.shelfLife && (
                      <span className="text-red-500 font-bold text-[9px] tracking-wide flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="w-3 h-3 shrink-0" /> {errors.shelfLife}
                      </span>
                    )}
                  </div>

                  {/* Custom Traceability Specs */}
                  <div className="border-t border-gray-100 pt-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-[10px] font-black text-[#A65D3D] uppercase tracking-wider">Custom Traceability Specs</h4>
                      <button
                        type="button"
                        onClick={addSpecField}
                        className="text-[#2F4B3C] hover:text-[#A65D3D] font-bold text-[9px] uppercase tracking-wider cursor-pointer"
                      >
                        + Add Parameter
                      </button>
                    </div>

                    <div className="space-y-3">
                      {specs.map((s, index) => (
                        <div key={index} className="grid grid-cols-5 gap-2 items-center bg-[#F6EFE3] p-2.5 rounded border border-gray-150/40 relative">
                          <input
                            type="text"
                            placeholder="Key (e.g. Grade)"
                            value={s.key}
                            onChange={(e) => handleSpecChange(index, 'key', e.target.value)}
                            className="border border-gray-200 rounded py-1 px-2 w-full text-[10px] col-span-2 bg-white font-semibold"
                          />
                          <input
                            type="text"
                            placeholder="Value (e.g. Grade A)"
                            value={s.value}
                            onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
                            className="border border-gray-200 rounded py-1 px-2 w-full text-[10px] col-span-2 bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => removeSpecField(index)}
                            className="text-red-500 hover:text-red-750 font-bold text-[11px] text-right cursor-pointer select-none"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Wizard Modal Navigation triggers */}
            <div className="flex justify-between items-center border-t border-gray-100 pt-4 mt-4 select-none">
              <div className="flex gap-2">
                {modalStep > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-5 rounded uppercase text-[9px] tracking-wider cursor-pointer"
                  >
                    Back
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                {modalStep < 4 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="bg-[#2F4B3C] hover:bg-[#A65D3D] text-white font-bold py-2.5 px-5 rounded uppercase text-[9px] tracking-wider cursor-pointer"
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="bg-[#2F4B3C] hover:bg-[#A65D3D] text-white font-bold py-2.5 px-6 rounded uppercase text-[9px] tracking-wider cursor-pointer disabled:opacity-40"
                  >
                    {submitting ? 'Saving Item...' : 'Confirm Publish'}
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* CLAY STYLED ARCHIVE CONFIRMATION DIALOG MODAL */}
      {isDeleteOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none">
          <div className="bg-white rounded-xl border border-gray-200 max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-serif text-sm font-bold text-[#2F4B3C] flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-[#A65D3D]" /> Confirm Catalog Archiving
            </h3>
            
            <p className="text-xs text-gray-550 leading-relaxed font-light">
              Are you sure you want to archive **{selectedProduct.name}**? Archived products will be hidden from client storefronts but retained for MERN historical order audits.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setIsDeleteOpen(false); setSelectedProduct(null); }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded uppercase text-[9px] tracking-wider cursor-pointer"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={confirmArchiveProduct}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded uppercase text-[9px] tracking-wider cursor-pointer"
              >
                Confirm Archive
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminProducts;
