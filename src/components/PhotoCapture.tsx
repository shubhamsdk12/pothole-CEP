import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from '@/hooks/useLocation';
import { supabase } from '@/integrations/supabase/client';
import { Camera, MapPin, Upload, CheckCircle } from 'lucide-react';

const PhotoCapture = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { location, loading: locationLoading, getCurrentLocation } = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user || !location) {
      toast({
        title: 'Missing information',
        description: 'Please select a photo and allow location access',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);

    try {
      // Upload photo to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('pothole-photos')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('pothole-photos')
        .getPublicUrl(fileName);

      // Run detection on the uploaded image
      const detectRes = await fetch('http://localhost:8000/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: publicUrl })
      });

      if (!detectRes.ok) {
        // Best-effort cleanup of the uploaded file
        await supabase.storage.from('pothole-photos').remove([fileName]);
        const errText = await detectRes.text();
        throw new Error(`Detection service error: ${errText}`);
      }

      const detectJson = await detectRes.json();
      if (!detectJson.detected) {
        // Not a pothole; cleanup and abort
        await supabase.storage.from('pothole-photos').remove([fileName]);
        toast({
          title: 'No pothole detected',
          description: 'Please upload a clear pothole image.',
          variant: 'destructive'
        });
        setUploading(false);
        return;
      }

      // Save report to database
      const { error: dbError } = await supabase
        .from('pothole_reports')
        .insert({
          user_id: user.id,
          photo_url: publicUrl,
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address,
          severity,
          description,
          status: 'pending'
        });

      if (dbError) throw dbError;

      toast({
        title: 'Report submitted!',
        description: 'Your pothole report has been submitted and will be processed'
      });

      // Reset form
      setSelectedFile(null);
      setPreviewUrl(null);
      setDescription('');
      setSeverity('medium');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive'
      });
    }

    setUploading(false);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Report a Pothole
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Photo Selection */}
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {previewUrl ? (
            <div className="space-y-2">
              <img
                src={previewUrl}
                alt="Pothole preview"
                className="w-full h-48 object-cover rounded-md border"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Change Photo
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={handleCameraCapture}
                className="h-24 flex-col"
              >
                <Camera className="h-6 w-6 mb-1" />
                Take Photo
              </Button>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="h-24 flex-col"
              >
                <Upload className="h-6 w-6 mb-1" />
                Upload Photo
              </Button>
            </div>
          )}
        </div>

        {/* Location */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Location</span>
            <Button
              variant="outline"
              size="sm"
              onClick={getCurrentLocation}
              disabled={locationLoading}
            >
              <MapPin className="h-4 w-4 mr-1" />
              {locationLoading ? 'Getting...' : 'Get Location'}
            </Button>
          </div>
          {location && (
            <div className="p-2 bg-muted rounded-md text-sm">
              <div className="flex items-center gap-1 mb-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="font-medium">Location captured</span>
              </div>
              <p className="text-muted-foreground">{location.address}</p>
              <p className="text-xs text-muted-foreground">
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </p>
            </div>
          )}
        </div>

        {/* Severity */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Severity</label>
          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Low</Badge>
                  <span>Minor surface damage</span>
                </div>
              </SelectItem>
              <SelectItem value="medium">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Medium</Badge>
                  <span>Noticeable pothole</span>
                </div>
              </SelectItem>
              <SelectItem value="high">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">High</Badge>
                  <span>Large pothole</span>
                </div>
              </SelectItem>
              <SelectItem value="critical">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">Critical</Badge>
                  <span>Dangerous condition</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Description (Optional)</label>
          <Textarea
            placeholder="Additional details about the pothole..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || !location || uploading}
          className="w-full"
        >
          {uploading ? 'Submitting Report...' : 'Submit Report'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PhotoCapture;