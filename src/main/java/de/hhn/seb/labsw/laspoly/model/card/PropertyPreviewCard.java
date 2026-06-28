/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.card;

import de.hhn.seb.labsw.laspoly.model.card.ActionMenuCard;
import de.hhn.seb.labsw.laspoly.model.field.Property;

public abstract class PropertyPreviewCard<T extends Property>
extends ActionMenuCard {
    private final T property;

    public PropertyPreviewCard(T prop) {
        this.property = prop;
    }

    public T getProperty() {
        return this.property;
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{" + "property=" + this.property + '}';
    }
}

