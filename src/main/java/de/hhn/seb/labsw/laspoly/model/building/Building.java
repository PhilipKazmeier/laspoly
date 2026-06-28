/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.building;

import de.hhn.seb.labsw.laspoly.view.paint.AbsNodeHolder;
import de.hhn.seb.labsw.laspoly.view.paint.Drawable;

public abstract class Building
implements Drawable {
    public String toString() {
        return this.getClass().getName() + "{}";
    }

    public class NodeHolder
    implements AbsNodeHolder {
        @Override
        public double getBottomHeight() {
            return -1.0;
        }
    }
}

