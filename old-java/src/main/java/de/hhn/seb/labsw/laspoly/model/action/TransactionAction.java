/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.action;

import de.hhn.seb.labsw.laspoly.exception.InvalidParameterException;
import de.hhn.seb.labsw.laspoly.model.User;
import de.hhn.seb.labsw.laspoly.model.action.Action;
import de.hhn.seb.labsw.laspoly.model.action.ActionType;

public class TransactionAction
extends Action {
    private final User user;
    private final int amount;
    private final boolean positive;

    public TransactionAction(User transactor, int transactionAmount, boolean add, User transActuator) {
        super(ActionType.TRANSACTION, transActuator);
        this.user = transactor;
        if (transactionAmount < 0) {
            throw new InvalidParameterException("Value should be positive", "transactionAmount", transactionAmount);
        }
        this.amount = transactionAmount;
        this.positive = add;
    }

    public User getUser() {
        return this.user;
    }

    public int getAmount() {
        return this.amount;
    }

    public boolean isPositive() {
        return this.positive;
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{" + "user=" + this.user + ", amount=" + this.amount + ", positive=" + this.positive + '}';
    }
}

