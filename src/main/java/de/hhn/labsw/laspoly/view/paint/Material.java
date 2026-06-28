package de.hhn.labsw.laspoly.view.paint;
import javafx.scene.paint.*;

/**
 * Material represents a 3D structure with a diffuse and a spot colour.
 */
public class Material extends PhongMaterial {
    /**
     * a simple red material.
     */
    public static final Material RED = new Material(Color.DARKRED, Color.RED);
    /**
     * Black darkgrey material.
     */
    public static final Material BLACK = new Material(Color.BLACK, Color.DARKGRAY);
    /**
     * Green ellow material.
     */
    public static final Material GREEN = new Material(Color.GREEN, Color.GREENYELLOW);

    /**
     * Created a material with the given diffuse color and a brighter spot clour if available.
     */
    public Material(Color diffuse, Color specular) {
        setDiffuseColor(diffuse);
        setSpecularColor(specular);
    }

    /**
     * Creates a Material with the given diffuse colour and a brighter spot colour (if available)
     */
    public Material(Color base) {
        setDiffuseColor(base);
        setSpecularColor(base.brighter());
    }
}
