/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.scene.Group
 *  javafx.scene.Node
 *  javafx.scene.paint.Material
 */
package de.hhn.seb.labsw.laspoly.model.field.specialfield;

import de.hhn.seb.labsw.laspoly.model.field.Field;
import de.hhn.seb.labsw.laspoly.view.View;
import javafx.scene.Group;
import javafx.scene.Node;
import javafx.scene.paint.Material;

public abstract class SpecialField
extends Field {
    public static final double WIDTH = 150.0;
    public static final double DEPTH = 150.0;

    protected SpecialField(int pos) {
        super(pos);
    }

    @Override
    public Group draw() {
        return new Group(new Node[]{this.getNodes().getBaseShape()});
    }

    @Override
    protected void onHoverStart() {
        super.onHoverStart();
        this.getNodes().getBaseShape().setMaterial((Material)View.Materials.FIELD_MATERIAL_HOVER);
    }

    @Override
    protected void onHoverEnd() {
        super.onHoverStart();
        this.getNodes().getBaseShape().setMaterial((Material)View.Materials.FIELD_MATERIAL);
    }

    @Override
    public double getWidth() {
        return 150.0;
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{}";
    }
}

