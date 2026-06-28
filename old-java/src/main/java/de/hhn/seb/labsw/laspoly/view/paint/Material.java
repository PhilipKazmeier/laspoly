/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.scene.paint.Color
 *  javafx.scene.paint.PhongMaterial
 */
package de.hhn.seb.labsw.laspoly.view.paint;

import javafx.scene.image.Image;
import javafx.scene.paint.Color;
import javafx.scene.paint.PhongMaterial;

public class Material
extends PhongMaterial {
    public static final Material RED = new Material(Color.DARKRED, Color.RED);
    public static final Material BLACK = new Material(Color.BLACK, Color.DARKGRAY);
    public static final Material GREEN = new Material(Color.GREEN, Color.GREENYELLOW);
    public static final PhongMaterial BEIGE = colored(Color.rgb((int)245, (int)245, (int)220));

    public Material(Color diffuse, Color specular) {
        this.setDiffuseColor(diffuse);
        this.setSpecularColor(specular);
    }

    public Material(Color base) {
        this.setDiffuseColor(base);
        this.setSpecularColor(base.brighter());
    }

    /**
     * Work around JDK-8318985: on macOS 14+, unset specular color yields 0 specular power in the
     * shader and horizontal 3D surfaces go black at shallow camera angles.
     */
    public static void ensureSpecular(PhongMaterial material) {
        if (material.getSpecularColor() == null) {
            Color diffuse = material.getDiffuseColor();
            material.setSpecularColor(diffuse != null ? diffuse.brighter() : Color.WHITE);
        }
    }

    public static PhongMaterial colored(Color diffuse) {
        PhongMaterial material = new PhongMaterial(diffuse);
        ensureSpecular(material);
        return material;
    }

    public static PhongMaterial textured(Image diffuseMap) {
        PhongMaterial material = new PhongMaterial();
        material.setDiffuseMap(diffuseMap);
        ensureSpecular(material);
        return material;
    }
}

