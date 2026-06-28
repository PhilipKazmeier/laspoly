/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.scene.Group
 *  javafx.scene.Node
 *  javafx.scene.shape.MeshView
 *  javafx.scene.transform.Rotate
 *  javafx.scene.transform.Scale
 *  javafx.scene.transform.Transform
 *  javafx.scene.transform.Translate
 */
package de.hhn.seb.labsw.laspoly.utils;

import javafx.scene.Group;
import javafx.scene.Node;
import javafx.scene.shape.MeshView;
import javafx.scene.transform.Rotate;
import javafx.scene.transform.Scale;
import javafx.scene.transform.Transform;
import javafx.scene.transform.Translate;

public class EnhancedGroup
extends Group
implements Cloneable {
    private Translate t;
    private Translate p;
    private Translate ip;
    private Rotate rx;
    private Rotate ry;
    private Rotate rz;
    private Scale s;

    public EnhancedGroup() {
        this.assignVariables();
        this.getTransforms().addAll(new Transform[]{this.t, this.rz, this.ry, this.rx, this.s});
    }

    public EnhancedGroup(MeshView[] views) {
        super((Node[])views);
        this.assignVariables();
        this.getTransforms().addAll(new Transform[]{this.t, this.rz, this.ry, this.rx, this.s});
    }

    public EnhancedGroup(RotateOrder rotateOrder) {
        this.assignVariables();
        switch (rotateOrder) {
            case XYZ: {
                this.getTransforms().addAll(new Transform[]{this.t, this.p, this.rz, this.ry, this.rx, this.s, this.ip});
                break;
            }
            case YXZ: {
                this.getTransforms().addAll(new Transform[]{this.t, this.p, this.rz, this.rx, this.ry, this.s, this.ip});
                break;
            }
            default: {
                this.getTransforms().addAll(new Transform[]{this.t, this.p, this.rz, this.ry, this.rx, this.s, this.ip});
            }
        }
    }

    public EnhancedGroup(Node ... children) {
        this();
        this.getChildren().addAll(children);
    }

    public Translate getT() {
        return this.t;
    }

    public Scale getS() {
        return this.s;
    }

    public Translate getP() {
        return this.p;
    }

    public Translate getIp() {
        return this.ip;
    }

    public Rotate getRx() {
        return this.rx;
    }

    public final void setRx(double x) {
        this.rx.setAngle(x);
    }

    public Rotate getRy() {
        return this.ry;
    }

    public final void setRy(double y) {
        this.ry.setAngle(y);
    }

    public Rotate getRz() {
        return this.rz;
    }

    public final void setRz(double z) {
        this.rz.setAngle(z);
    }

    private void assignVariables() {
        this.t = new Translate();
        this.p = new Translate();
        this.ip = new Translate();
        this.s = new Scale();
        this.ry = new Rotate();
        this.rx = new Rotate();
        this.rz = new Rotate();
        this.ry.setAxis(Rotate.Y_AXIS);
        this.rx.setAxis(Rotate.X_AXIS);
        this.rz.setAxis(Rotate.Z_AXIS);
    }

    public EnhancedGroup clone() throws CloneNotSupportedException {
        return new EnhancedGroup(new Node[]{(EnhancedGroup)super.clone()});
    }

    public void setTranslate(double x, double y, double z) {
        this.t.setX(x);
        this.t.setY(y);
        this.t.setZ(z);
    }

    public void setTx(double x) {
        this.t.setX(x);
    }

    public void setTy(double y) {
        this.t.setY(y);
    }

    public void setTz(double z) {
        this.t.setZ(z);
    }

    public void setRotate(double x, double y, double z) {
        this.rx.setAngle(x);
        this.ry.setAngle(y);
        this.rz.setAngle(z);
    }

    public final void setScale(double scaleFactor) {
        this.s.setX(scaleFactor);
        this.s.setY(scaleFactor);
        this.s.setZ(scaleFactor);
    }

    public final void setSx(double x) {
        this.s.setX(x);
    }

    public final void setSy(double y) {
        this.s.setY(y);
    }

    public final void setSz(double z) {
        this.s.setZ(z);
    }

    public void setPivot(double x, double y, double z) {
        this.p.setX(x);
        this.p.setY(y);
        this.p.setZ(z);
        this.ip.setX(-x);
        this.ip.setY(-y);
        this.ip.setZ(-z);
    }

    public void reset() {
        this.t.setX(0.0);
        this.t.setY(0.0);
        this.t.setZ(0.0);
        this.rx.setAngle(0.0);
        this.ry.setAngle(0.0);
        this.rz.setAngle(0.0);
        this.s.setX(1.0);
        this.s.setY(1.0);
        this.s.setZ(1.0);
        this.p.setX(0.0);
        this.p.setY(0.0);
        this.p.setZ(0.0);
        this.ip.setX(0.0);
        this.ip.setY(0.0);
        this.ip.setZ(0.0);
    }

    public static enum RotateOrder {
        XYZ,
        YXZ;

    }
}

