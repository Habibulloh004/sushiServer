export const ClickError = {
	Success: 0,
	SignFailed: -1,
	InvalidAmount: -2,
	ActionNotFound: -3,
	AlreadyPaid: -4,
	UserNotFound: -5,
	TransactionNotFound: -6,
	BadRequest: -8,
	TransactionCanceled: -9,
};

export const ClickAction = {
	Prepare: 0,
	Complete: 1,
};

export const PaymeMethod = {
	CheckPerformTransaction: 'CheckPerformTransaction',
	CheckTransaction: 'CheckTransaction',
	CreateTransaction: 'CreateTransaction',
	PerformTransaction: 'PerformTransaction',
	CancelTransaction: 'CancelTransaction',
	GetStatement: 'GetStatement',
};

export const PaymeError = {
	InvalidAmount: {
		name: 'InvalidAmount',
		code: -31001,
		message: {
			uz: "Noto'g'ri summa",
			ru: 'Недопустимая сумма',
			en: 'Invalid amount',
		},
	},
	CantDoOperation: {
		name: 'CantDoOperation',
		code: -31008,
		message: {
			uz: 'Biz operatsiyani bajara olmaymiz',
			ru: 'Мы не можем сделать операцию',
			en: "We can't do operation",
		},
	},
	TransactionNotFound: {
		name: 'TransactionNotFound',
		code: -31050,
		message: {
			uz: 'Tranzaktsiya topilmadi',
			ru: 'Транзакция не найдена',
			en: 'Transaction not found',
		},
	},
	AlreadyDone: {
		name: 'AlreadyDone',
		code: -31060,
		message: {
			uz: "Mahsulot uchun to'lov qilingan",
			ru: 'Оплачено за товар',
			en: 'Paid for the product',
		},
	},
	Pending: {
		name: 'Pending',
		code: -31050,
		message: {
			uz: "Mahsulot uchun to'lov kutilayapti",
			ru: 'Ожидается оплата товар',
			en: 'Payment for the product is pending',
		},
	},
	InvalidAuthorization: {
		name: 'InvalidAuthorization',
		code: -32504,
		message: {
			uz: 'Avtorizatsiya yaroqsiz',
			ru: 'Авторизация недействительна',
			en: 'Authorization invalid',
		},
	},
};

export const PaymeData = {
	UserId: 'order_id',
};

export const TransactionState = {
	Paid: 2,
	Pending: 1,
	PendingCanceled: -1,
	PaidCanceled: -2,
};
