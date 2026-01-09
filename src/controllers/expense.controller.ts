import { Request, Response, NextFunction } from 'express';
import { FinancialTransaction } from '../models/FinancialTransaction';
import { ExpenseCategory } from '../models/ExpenseCategory';
import { AppError } from '../middleware/errorHandler';

// 📊 CREAR GASTO
export const createExpense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { storeId, amount, description, categoryId } = req.body;

    const expense = await FinancialTransaction.create({
      type: 'expense',
      date: new Date(),
      storeId,
      amount,
      description,
      categoryId,
    });

    await expense.populate('categoryId', 'name icon');

    res.status(201).json({
      status: 'success',
      data: { expense }
    });
  } catch (error) {
    next(error);
  }
};

// 📋 OBTENER GASTOS (CON FILTROS)
export const getExpenses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { storeId, categoryId, startDate, endDate } = req.query;
    const filter: any = { type: 'expense' };

    if (storeId) filter.storeId = storeId;
    if (categoryId) filter.categoryId = categoryId;

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate as string);
      if (endDate) filter.date.$lte = new Date(endDate as string);
    }

    const expenses = await FinancialTransaction.find(filter)
      .populate('categoryId', 'name icon')
      .sort({ date: -1 });

    res.json({
      status: 'success',
      results: expenses.length,
      data: { expenses }
    });
  } catch (error) {
    next(error);
  }
};

// 📊 REPORTE DE GASTOS POR PERÍODO
export const getExpenseReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { storeId, period, startDate, endDate } = req.query;

    if (!storeId) {
      return next(new AppError('storeId is required', 400));
    }

    let dateFilter: any = {};
    const now = new Date();

    // Determinar rango de fechas según período
    if (period) {
      switch (period) {
        case 'daily':
          dateFilter.$gte = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          dateFilter.$lt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          break;
        case 'weekly':
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          dateFilter.$gte = weekStart;
          dateFilter.$lt = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          dateFilter.$gte = new Date(now.getFullYear(), now.getMonth(), 1);
          dateFilter.$lt = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          break;
        case 'yearly':
          dateFilter.$gte = new Date(now.getFullYear(), 0, 1);
          dateFilter.$lt = new Date(now.getFullYear() + 1, 0, 1);
          break;
      }
    } else if (startDate && endDate) {
      // Período personalizado
      dateFilter.$gte = new Date(startDate as string);
      dateFilter.$lte = new Date(endDate as string);
    } else {
      return next(new AppError('period or startDate/endDate is required', 400));
    }

    // Obtener gastos
    const expenses = await FinancialTransaction.find({
      type: 'expense',
      storeId,
      date: dateFilter,
    })
      .populate('categoryId', 'name icon')
      .sort({ date: -1 });

    // Agrupar por categoría
    const byCategory: any = {};
    let totalExpense = 0;

    expenses.forEach(expense => {
      totalExpense += expense.amount;

      const categoryName = expense.categoryId ? (expense.categoryId as any).name : 'Sin categoría';
      if (!byCategory[categoryName]) {
        byCategory[categoryName] = {
          name: categoryName,
          icon: expense.categoryId ? (expense.categoryId as any).icon : undefined,
          total: 0,
          count: 0,
          items: []
        };
      }

      byCategory[categoryName].total += expense.amount;
      byCategory[categoryName].count += 1;
      byCategory[categoryName].items.push({
        id: expense._id,
        date: expense.date,
        amount: expense.amount,
        description: expense.description,
      });
    });

    const report = {
      period: period || 'custom',
      startDate: dateFilter.$gte || startDate,
      endDate: dateFilter.$lt || dateFilter.$lte || endDate,
      totalExpense,
      expenseCount: expenses.length,
      byCategory: Object.values(byCategory),
      topExpenses: expenses.slice(0, 10),
      averageExpense: expenses.length > 0 ? totalExpense / expenses.length : 0
    };

    res.json({
      status: 'success',
      data: { report }
    });
  } catch (error) {
    next(error);
  }
};

// 📈 COMPARAR PERÍODOS
export const compareExpensePeriods = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { storeId, period1Start, period1End, period2Start, period2End } = req.query;

    if (!storeId) {
      return next(new AppError('storeId is required', 400));
    }

    const getExpensesSummary = async (start: string, end: string) => {
      const expenses = await FinancialTransaction.find({
        type: 'expense',
        storeId,
        date: {
          $gte: new Date(start),
          $lte: new Date(end)
        },
        status: { $in: ['approved', 'pending'] }
      }).populate('categoryId', 'name');

      let total = 0;
      const byCategory: any = {};

      expenses.forEach(expense => {
        total += expense.amount;
        const categoryName = expense.categoryId ? (expense.categoryId as any).name : 'Sin categoría';

        if (!byCategory[categoryName]) {
          byCategory[categoryName] = 0;
        }
        byCategory[categoryName] += expense.amount;
      });

      return { total, count: expenses.length, byCategory };
    };

    const period1 = await getExpensesSummary(period1Start as string, period1End as string);
    const period2 = await getExpensesSummary(period2Start as string, period2End as string);

    const difference = period2.total - period1.total;
    const percentageChange = period1.total > 0 ? ((difference / period1.total) * 100).toFixed(2) : '0';

    res.json({
      status: 'success',
      data: {
        period1: {
          startDate: period1Start,
          endDate: period1End,
          ...period1
        },
        period2: {
          startDate: period2Start,
          endDate: period2End,
          ...period2
        },
        comparison: {
          difference,
          percentageChange: `${percentageChange}%`,
          trend: difference > 0 ? 'increased' : 'decreased'
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// 🏷️ CREAR CATEGORÍA DE GASTO
export const createExpenseCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { storeId, name, description, icon } = req.body;

    const category = await ExpenseCategory.create({
      storeId,
      name,
      description,
      icon,
      isActive: true
    });

    res.status(201).json({
      status: 'success',
      data: { category }
    });
  } catch (error) {
    next(error);
  }
};

// 📋 OBTENER CATEGORÍAS
export const getExpenseCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { storeId, isActive } = req.query;
    const filter: any = {};

    if (storeId) filter.storeId = storeId;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const categories = await ExpenseCategory.find(filter).sort({ name: 1 });

    res.json({
      status: 'success',
      results: categories.length,
      data: { categories }
    });
  } catch (error) {
    next(error);
  }
};

// 🗑️ ELIMINAR GASTO
export const deleteExpense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const expense = await FinancialTransaction.findByIdAndDelete(id);

    if (!expense) {
      return next(new AppError('Expense not found', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

// ✏️ ACTUALIZAR GASTO
export const updateExpense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { amount, description, categoryId, status, approvedBy, supplierName } = req.body;

    const expense = await FinancialTransaction.findByIdAndUpdate(
      id,
      {
        amount,
        description,
        categoryId,
        status,
        approvedBy,
        supplierName,
        approvalDate: status === 'approved' ? new Date() : undefined
      },
      { new: true, runValidators: true }
    ).populate('categoryId', 'name icon');

    if (!expense) {
      return next(new AppError('Expense not found', 404));
    }

    res.json({
      status: 'success',
      data: { expense }
    });
  } catch (error) {
    next(error);
  }
};
