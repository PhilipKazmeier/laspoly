/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.card.action.actioncards;

import de.hhn.seb.labsw.laspoly.model.card.action.SingleOptionActionCard;
import java.util.Locale;

public abstract class TransactionActionCard
extends SingleOptionActionCard {
    private final boolean positive;
    private final int multiplier;

    public TransactionActionCard(Locale loc, String identifier, boolean pos, int multiplierVal) {
        super(loc, identifier);
        this.positive = pos;
        this.multiplier = multiplierVal;
    }

    public boolean isPositive() {
        return this.positive;
    }

    public int getMultiplier() {
        return this.multiplier;
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{" + "positive=" + this.positive + ", multiplier=" + this.multiplier + '}';
    }
}

